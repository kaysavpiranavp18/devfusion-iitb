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

function formatComment(c: any): any {
  return {
    id: c.id,
    taskId: c.task_id,
    userId: c.user_id,
    content: c.content,
    mentions: c.mentions || [],
    createdAt: c.created_at,
    user: c.user ? {
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
      avatar: c.user.avatar,
      bio: c.user.bio,
      skills: c.user.skills,
      github: c.user.github,
      createdAt: c.user.created_at
    } : undefined
  };
}

export async function getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { taskId } = req.params;

    // Get task to check access
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, task.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    const { data: comments, error } = await supabase
      .from('task_comments')
      .select('*, user:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const formatted = (comments || []).map(formatComment);
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { taskId } = req.params;
    const { content, mentions } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Get task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('project_id, title')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, task.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Get project workspace_id
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', task.project_id)
      .single();

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Insert comment
    const { data: newComment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: req.user.id,
        content,
        mentions: mentions || []
      })
      .select()
      .single();

    if (error || !newComment) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to add comment' });
    }

    // Fetch comment with user info
    const { data: commentWithUser } = await supabase
      .from('task_comments')
      .select('*, user:profiles(*)')
      .eq('id', newComment.id)
      .single();

    const formatted = formatComment(commentWithUser);

    // Get profile for activity logging / notifications
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', req.user.id)
      .single();

    // Log Activity
    await supabase.from('activity_logs').insert({
      workspace_id: project.workspace_id,
      project_id: task.project_id,
      type: 'comment_added',
      message: `${userProfile?.name || 'User'} commented on task "${task.title}"`,
      user_id: req.user.id
    });

    // Notify mentioned users
    if (mentions && Array.isArray(mentions)) {
      for (const mentionUserId of mentions) {
        if (mentionUserId === req.user.id) continue;
        const { data: newNotif } = await supabase
          .from('notifications')
          .insert({
            user_id: mentionUserId,
            title: 'Mentioned in Comment',
            message: `${userProfile?.name || 'User'} mentioned you in a comment on "${task.title}"`,
            type: 'mention',
            link: `/workspace/${project.workspace_id}/project/${task.project_id}/board`
          })
          .select()
          .single();

        if (newNotif) {
          emitToRoom(`user:${mentionUserId}`, 'notification:new', newNotif);
        }
      }
    }

    // Notify task assignee if not the commenter and not already notified as mentioned
    // Let's get task assignee
    const { data: fullTask } = await supabase
      .from('tasks')
      .select('assignee_id')
      .eq('id', taskId)
      .single();

    if (fullTask && fullTask.assignee_id && fullTask.assignee_id !== req.user.id) {
      const alreadyNotified = mentions && mentions.includes(fullTask.assignee_id);
      if (!alreadyNotified) {
        const { data: newNotif } = await supabase
          .from('notifications')
          .insert({
            user_id: fullTask.assignee_id,
            title: 'New Comment',
            message: `${userProfile?.name || 'User'} commented on your assigned task "${task.title}"`,
            type: 'comment',
            link: `/workspace/${project.workspace_id}/project/${task.project_id}/board`
          })
          .select()
          .single();

        if (newNotif) {
          emitToRoom(`user:${fullTask.assignee_id}`, 'notification:new', newNotif);
        }
      }
    }

    // Emit Socket event to project room
    emitToRoom(`project:${task.project_id}`, 'comment:added', {
      taskId,
      comment: formatted
    });

    return res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    // Fetch comment to check ownership
    const { data: comment, error: fetchErr } = await supabase
      .from('task_comments')
      .select('user_id, task_id')
      .eq('id', id)
      .single();

    if (fetchErr || !comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only delete your own comments' });
    }

    // Get project_id for socket emission
    const { data: task } = await supabase
      .from('tasks')
      .select('project_id')
      .eq('id', comment.task_id)
      .single();

    const { error: deleteErr } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return res.status(400).json({ success: false, error: deleteErr.message });
    }

    if (task) {
      emitToRoom(`project:${task.project_id}`, 'comment:deleted', {
        taskId: comment.task_id,
        commentId: id
      });
    }

    return res.status(200).json({ success: true, data: { id, message: 'Comment deleted successfully' } });
  } catch (err) {
    next(err);
  }
}
