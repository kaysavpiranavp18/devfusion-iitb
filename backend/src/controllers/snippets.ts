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

function formatSnippet(s: any): any {
  return {
    id: s.id,
    projectId: s.project_id,
    title: s.title,
    filename: s.filename || undefined,
    code: s.code,
    language: s.language,
    tags: (s.tags || []).map((t: any) => t.tag),
    description: s.description || '',
    createdBy: s.created_by,
    createdAt: s.created_at,
    updatedAt: s.updated_at
  };
}

export async function getSnippets(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;
    const { search, tag } = req.query;

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    let query = supabase
      .from('snippets')
      .select('*, tags:snippet_tags(tag)')
      .eq('project_id', projectId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    const { data: snippets, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    let formatted = (snippets || []).map(formatSnippet);

    if (tag) {
      const searchTag = (tag as string).toLowerCase();
      formatted = formatted.filter((s: any) => 
        s.tags.some((t: string) => t.toLowerCase() === searchTag)
      );
    }

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createSnippet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;
    const { title, filename, code, language, tags, description } = req.body;

    if (!title || !code || !language) {
      return res.status(400).json({ success: false, error: 'Title, code, and language are required' });
    }

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Insert snippet
    const { data: snippet, error } = await supabase
      .from('snippets')
      .insert({
        project_id: projectId,
        title,
        filename: filename || null,
        code,
        language,
        description: description || '',
        created_by: req.user.id
      })
      .select()
      .single();

    if (error || !snippet) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to create snippet' });
    }

    // Insert tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagsPayload = tags.map((t: string) => ({
        snippet_id: snippet.id,
        tag: t
      }));
      await supabase.from('snippet_tags').insert(tagsPayload);
    }

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
        type: 'snippet_added',
        message: `${userProfile?.name || 'User'} created snippet "${title}"`,
        user_id: req.user.id
      });
    }

    // Fetch full snippet with tags
    const { data: fullSnippet } = await supabase
      .from('snippets')
      .select('*, tags:snippet_tags(tag)')
      .eq('id', snippet.id)
      .single();

    const formatted = formatSnippet(fullSnippet);

    // Emit Socket event
    emitToRoom(`project:${projectId}`, 'snippet:created', formatted);

    return res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function updateSnippet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { title, filename, code, language, tags, description } = req.body;

    // Get existing snippet to check access
    const { data: existingSnippet } = await supabase
      .from('snippets')
      .select('project_id')
      .eq('id', id)
      .single();

    if (!existingSnippet) {
      return res.status(404).json({ success: false, error: 'Snippet not found' });
    }

    const role = await checkProjectAccess(req.user.id, existingSnippet.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (filename !== undefined) updates.filename = filename || null;
    if (code !== undefined) updates.code = code;
    if (language !== undefined) updates.language = language;
    if (description !== undefined) updates.description = description;
    updates.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('snippets')
      .update(updates)
      .eq('id', id);

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    // Update tags: delete old and insert new
    if (tags !== undefined && Array.isArray(tags)) {
      await supabase.from('snippet_tags').delete().eq('snippet_id', id);
      if (tags.length > 0) {
        const tagsPayload = tags.map((t: string) => ({
          snippet_id: id,
          tag: t
        }));
        await supabase.from('snippet_tags').insert(tagsPayload);
      }
    }

    // Fetch updated snippet
    const { data: updatedSnippet } = await supabase
      .from('snippets')
      .select('*, tags:snippet_tags(tag)')
      .eq('id', id)
      .single();

    const formatted = formatSnippet(updatedSnippet);

    // Emit Socket event
    emitToRoom(`project:${existingSnippet.project_id}`, 'snippet:updated', formatted);

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteSnippet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const { data: snippet } = await supabase
      .from('snippets')
      .select('project_id')
      .eq('id', id)
      .single();

    if (!snippet) {
      return res.status(404).json({ success: false, error: 'Snippet not found' });
    }

    const role = await checkProjectAccess(req.user.id, snippet.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    const { error } = await supabase
      .from('snippets')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Emit Socket delete event
    emitToRoom(`project:${snippet.project_id}`, 'snippet:deleted', { id });

    return res.status(200).json({ success: true, data: { id, message: 'Snippet deleted successfully' } });
  } catch (err) {
    next(err);
  }
}
