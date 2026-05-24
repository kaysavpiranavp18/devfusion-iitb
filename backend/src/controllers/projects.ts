import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

async function checkProjectAccess(userId: string, projectId: string) {
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  return membership?.role || null;
}

async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
  return membership?.role || null;
}

export async function getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { workspaceId } = req.params;

    const wsRole = await checkWorkspaceAccess(req.user.id, workspaceId);
    if (!wsRole) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this workspace' });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*, members:project_members(*, user:profiles(*))')
      .eq('workspace_id', workspaceId);

    if (error || !projects) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to fetch projects' });
    }

    const formatted = projects.map(p => ({
      id: p.id,
      workspaceId: p.workspace_id,
      name: p.name,
      description: p.description,
      color: p.color,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      members: (p.members || []).map((m: any) => ({
        user: m.user,
        role: m.role,
        joinedAt: m.joined_at
      }))
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { workspaceId } = req.params;
    const { name, description, color } = req.body;

    if (!name || !description || !color) {
      return res.status(400).json({ success: false, error: 'Name, description, and color are required' });
    }

    const wsRole = await checkWorkspaceAccess(req.user.id, workspaceId);
    if (wsRole !== 'owner' && wsRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Workspace admin access required' });
    }

    // Insert project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        color
      })
      .select()
      .single();

    if (pError || !project) {
      return res.status(400).json({ success: false, error: pError?.message || 'Failed to create project' });
    }

    // Insert project owner membership
    const { error: memError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: req.user.id,
        role: 'owner'
      });

    if (memError) {
      return res.status(500).json({ success: false, error: memError.message });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const formatted = {
      id: project.id,
      workspaceId: project.workspace_id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      members: [{
        user: userProfile,
        role: 'owner',
        joinedAt: project.created_at
      }]
    };

    return res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const pRole = await checkProjectAccess(req.user.id, id);
    if (!pRole) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, members:project_members(*, user:profiles(*))')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const formatted = {
      id: project.id,
      workspaceId: project.workspace_id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      members: (project.members || []).map((m: any) => ({
        user: m.user,
        role: m.role,
        joinedAt: m.joined_at
      }))
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { name, description, color } = req.body;

    const pRole = await checkProjectAccess(req.user.id, id);
    if (pRole !== 'owner' && pRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Project admin access required' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    updates.updated_at = new Date().toISOString();

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*, members:project_members(*, user:profiles(*))')
      .single();

    if (error || !project) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to update project' });
    }

    const formatted = {
      id: project.id,
      workspaceId: project.workspace_id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      members: (project.members || []).map((m: any) => ({
        user: m.user,
        role: m.role,
        joinedAt: m.joined_at
      }))
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const pRole = await checkProjectAccess(req.user.id, id);
    if (pRole !== 'owner') {
      return res.status(403).json({ success: false, error: 'Forbidden: Only project owner can delete project' });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: { message: 'Project deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function addProjectMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const pRole = await checkProjectAccess(req.user.id, id);
    if (pRole !== 'owner' && pRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Project admin access required' });
    }

    // Verify user is in workspace first
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const wsMemberRole = await checkWorkspaceAccess(userId, project.workspace_id);
    if (!wsMemberRole) {
      return res.status(400).json({ success: false, error: 'User must be a member of the workspace first' });
    }

    const existingProjectRole = await checkProjectAccess(userId, id);
    if (existingProjectRole) {
      return res.status(400).json({ success: false, error: 'User is already a member of this project' });
    }

    const { data: membership, error: memErr } = await supabase
      .from('project_members')
      .insert({
        project_id: id,
        user_id: userId,
        role: role || 'member'
      })
      .select('*, user:profiles(*)')
      .single();

    if (memErr || !membership) {
      return res.status(400).json({ success: false, error: memErr?.message || 'Failed to add project member' });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: membership.user,
        role: membership.role,
        joinedAt: membership.joined_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function removeProjectMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id, userId } = req.params;

    const requesterRole = await checkProjectAccess(req.user.id, id);
    if (req.user.id !== userId && requesterRole !== 'owner' && requesterRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Unauthorized to remove member' });
    }

    const memberRole = await checkProjectAccess(userId, id);
    if (!memberRole) {
      return res.status(404).json({ success: false, error: 'Member not found in project' });
    }

    if (memberRole === 'owner') {
      return res.status(400).json({ success: false, error: 'Cannot remove project owner' });
    }

    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: { message: 'Member removed from project' } });
  } catch (err) {
    next(err);
  }
}
