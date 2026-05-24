import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle();
  return membership?.role || null;
}

function formatActivity(a: any): any {
  return {
    id: a.id,
    workspaceId: a.workspace_id,
    projectId: a.project_id || undefined,
    type: a.type,
    message: a.message,
    userId: a.user_id,
    metadata: a.metadata || undefined,
    createdAt: a.created_at
  };
}

export async function getActivities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { workspaceId } = req.params;
    const { projectId, userId, limit, offset } = req.query;

    // Check workspace membership
    const role = await checkWorkspaceAccess(req.user.id, workspaceId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this workspace' });
    }

    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const limitVal = parseInt(limit as string, 10) || 50;
    const offsetVal = parseInt(offset as string, 10) || 0;

    const { data: activities, error } = await query
      .order('created_at', { ascending: false })
      .range(offsetVal, offsetVal + limitVal - 1);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const formatted = (activities || []).map(formatActivity);
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}
