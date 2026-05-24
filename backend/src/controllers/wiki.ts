import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { emitToRoom } from '../socket';

async function checkProjectAccess(userId: string, projectId: string) {
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return membership?.role || null;
}

function formatWikiPage(wp: any, versions: any[] = []): any {
  return {
    id: wp.id,
    projectId: wp.project_id,
    title: wp.title,
    content: wp.content,
    linkedPages: wp.linked_pages || [],
    parentId: wp.parent_id || undefined,
    version: wp.version,
    versions: versions.map(v => ({
      version: v.version,
      content: v.content,
      updatedBy: v.updated_by,
      updatedAt: v.created_at
    })),
    createdBy: wp.created_by,
    createdAt: wp.created_at,
    updatedAt: wp.updated_at
  };
}

export async function getWikiPages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    const { data: pages, error } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!pages || pages.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const pageIds = pages.map(p => p.id);
    const { data: versions } = await supabase
      .from('wiki_page_versions')
      .select('*')
      .in('page_id', pageIds)
      .order('version', { ascending: false });

    const versionsMap: Record<string, any[]> = {};
    if (versions) {
      for (const v of versions) {
        if (!versionsMap[v.page_id]) {
          versionsMap[v.page_id] = [];
        }
        versionsMap[v.page_id].push(v);
      }
    }

    const formatted = pages.map(p => formatWikiPage(p, versionsMap[p.id] || []));
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createWikiPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;
    const { title, content, parentId, linkedPages } = req.body;

    if (!title || content === undefined) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Create page
    const { data: page, error } = await supabase
      .from('wiki_pages')
      .insert({
        project_id: projectId,
        title,
        content,
        parent_id: parentId || null,
        linked_pages: linkedPages || [],
        version: 1,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error || !page) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to create wiki page' });
    }

    // Insert version 1 history
    await supabase.from('wiki_page_versions').insert({
      page_id: page.id,
      version: 1,
      content,
      updated_by: req.user.id
    });

    // Get workspace ID for activity log
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single();

    if (project) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', req.user.id)
        .single();

      await supabase.from('activity_logs').insert({
        workspace_id: project.workspace_id,
        project_id: projectId,
        type: 'doc_created',
        message: `${userProfile?.name || 'User'} created wiki page "${title}"`,
        user_id: req.user.id
      });
    }

    // Fetch version history (which has just version 1)
    const { data: pageVersions } = await supabase
      .from('wiki_page_versions')
      .select('*')
      .eq('page_id', page.id)
      .order('version', { ascending: false });

    const formatted = formatWikiPage(page, pageVersions || []);

    // Emit Socket event
    emitToRoom(`project:${projectId}`, 'wiki:created', formatted);

    return res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function updateWikiPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { title, content, parentId, linkedPages } = req.body;

    // Get page to check access
    const { data: existingPage } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingPage) {
      return res.status(404).json({ success: false, error: 'Wiki page not found' });
    }

    const role = await checkProjectAccess(req.user.id, existingPage.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    // Insert draft/current state into wiki_page_versions before making updates
    // (This saves the state *before* this edit)
    await supabase.from('wiki_page_versions').insert({
      page_id: id,
      version: existingPage.version,
      content: existingPage.content,
      updated_by: req.user.id
    });

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (parentId !== undefined) updates.parent_id = parentId || null;
    if (linkedPages !== undefined) updates.linked_pages = linkedPages;
    // Increment version number
    updates.version = existingPage.version + 1;
    updates.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('wiki_pages')
      .update(updates)
      .eq('id', id);

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    // Get workspace ID for activity log
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', existingPage.project_id)
      .single();

    if (project) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', req.user.id)
        .single();

      await supabase.from('activity_logs').insert({
        workspace_id: project.workspace_id,
        project_id: existingPage.project_id,
        type: 'doc_updated',
        message: `${userProfile?.name || 'User'} updated wiki page "${title || existingPage.title}"`,
        user_id: req.user.id
      });
    }

    // Fetch updated page & all versions
    const { data: updatedPage } = await supabase
      .from('wiki_pages')
      .select('*')
      .eq('id', id)
      .single();

    const { data: pageVersions } = await supabase
      .from('wiki_page_versions')
      .select('*')
      .eq('page_id', id)
      .order('version', { ascending: false });

    const formatted = formatWikiPage(updatedPage, pageVersions || []);

    // Emit Socket event
    emitToRoom(`project:${existingPage.project_id}`, 'wiki:updated', formatted);

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteWikiPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const { data: page } = await supabase
      .from('wiki_pages')
      .select('project_id')
      .eq('id', id)
      .single();

    if (!page) {
      return res.status(404).json({ success: false, error: 'Wiki page not found' });
    }

    const role = await checkProjectAccess(req.user.id, page.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    const { error } = await supabase
      .from('wiki_pages')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Emit Socket delete event
    emitToRoom(`project:${page.project_id}`, 'wiki:deleted', { id });

    return res.status(200).json({ success: true, data: { id, message: 'Wiki page deleted successfully' } });
  } catch (err) {
    next(err);
  }
}
