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

// Helper to format a task matching the frontend expected shape
function formatTask(t: any): any {
  return {
    id: t.id,
    projectId: t.project_id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assigneeId: t.assignee_id || undefined,
    dueDate: t.due_date || undefined,
    labels: (t.labels || []).map((l: any) => l.label),
    attachments: t.attachments || [],
    comments: (t.comments || []).map((c: any) => ({
      id: c.id,
      taskId: c.task_id,
      userId: c.user_id,
      content: c.content,
      mentions: c.mentions || [],
      createdAt: c.created_at
    })),
    order: t.task_order,
    createdBy: t.created_by,
    createdAt: t.created_at,
    updatedAt: t.updated_at
  };
}

export async function getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, labels:task_labels(label), comments:task_comments(*, user:profiles(*))')
      .eq('project_id', projectId)
      .order('task_order', { ascending: true });

    if (error || !tasks) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to fetch tasks' });
    }

    const formatted = tasks.map(formatTask);
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { projectId } = req.params;
    const { title, description, status, priority, assigneeId, dueDate, labels } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const role = await checkProjectAccess(req.user.id, projectId);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    // Get current max order for tasks in this status
    const { data: orderData } = await supabase
      .from('tasks')
      .select('task_order')
      .eq('project_id', projectId)
      .eq('status', status || 'todo')
      .order('task_order', { ascending: false })
      .limit(1);

    const nextOrder = orderData && orderData.length > 0 ? orderData[0].task_order + 1 : 0;

    // Insert task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'p1',
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        task_order: nextOrder,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error || !task) {
      return res.status(400).json({ success: false, error: error?.message || 'Failed to create task' });
    }

    // Insert task labels
    if (labels && labels.length > 0) {
      const labelsPayload = labels.map((l: string) => ({ task_id: task.id, label: l }));
      await supabase.from('task_labels').insert(labelsPayload);
    }

    // Get workspace ID for activity log
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single();

    if (project) {
      // Log activity
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', req.user.id)
        .single();

      await supabase.from('activity_logs').insert({
        workspace_id: project.workspace_id,
        project_id: projectId,
        type: 'task_created',
        message: `${userProfile?.name || 'User'} created task "${title}"`,
        user_id: req.user.id
      });
    }

    // Fetch full task with labels and comments to emit
    const { data: fullTask } = await supabase
      .from('tasks')
      .select('*, labels:task_labels(label), comments:task_comments(*, user:profiles(*))')
      .eq('id', task.id)
      .single();

    const formatted = formatTask(fullTask);

    // Emit Socket event
    emitToRoom(`project:${projectId}`, 'task:created', formatted);

    // Notify assignee if any
    if (assigneeId && assigneeId !== req.user.id) {
      const { data: newNotif } = await supabase
        .from('notifications')
        .insert({
          user_id: assigneeId,
          title: 'Task Assigned',
          message: `You were assigned "${title}"`,
          type: 'assignment',
          link: `/workspace/${project?.workspace_id}/project/${projectId}/board`
        })
        .select()
        .single();
      
      if (newNotif) {
        emitToRoom(`user:${assigneeId}`, 'notification:new', newNotif);
      }
    }

    return res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const { data: task, error: fetchErr } = await supabase
      .from('tasks')
      .select('*, labels:task_labels(label), comments:task_comments(*, user:profiles(*))')
      .eq('id', id)
      .single();

    if (fetchErr || !task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, task.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have access to this project' });
    }

    return res.status(200).json({ success: true, data: formatTask(task) });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, dueDate, labels } = req.body;

    const { data: existingTask } = await supabase
      .from('tasks')
      .select('project_id, status, title')
      .eq('id', id)
      .single();

    if (!existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, existingTask.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigneeId !== undefined) updates.assignee_id = assigneeId || null;
    if (dueDate !== undefined) updates.due_date = dueDate || null;
    updates.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    // Sync labels: delete existing then insert on update
    if (labels !== undefined) {
      await supabase.from('task_labels').delete().eq('task_id', id);
      if (labels.length > 0) {
        const labelsPayload = labels.map((l: string) => ({ task_id: id, label: l }));
        await supabase.from('task_labels').insert(labelsPayload);
      }
    }

    // Get workspace ID for activity log
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', existingTask.project_id)
      .single();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', req.user.id)
      .single();

    const taskTitle = title || existingTask.title;

    if (status !== undefined && status !== existingTask.status) {
      // Status changed -> log task_moved
      if (project) {
        await supabase.from('activity_logs').insert({
          workspace_id: project.workspace_id,
          project_id: existingTask.project_id,
          type: 'task_moved',
          message: `${userProfile?.name || 'User'} moved "${taskTitle}" to ${status.replace('_', ' ')}`,
          user_id: req.user.id
        });
      }
    } else {
      // General update
      if (project) {
        await supabase.from('activity_logs').insert({
          workspace_id: project.workspace_id,
          project_id: existingTask.project_id,
          type: 'task_updated',
          message: `${userProfile?.name || 'User'} updated task "${taskTitle}"`,
          user_id: req.user.id
        });
      }
    }

    // Fetch updated task with details
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('*, labels:task_labels(label), comments:task_comments(*, user:profiles(*))')
      .eq('id', id)
      .single();

    const formatted = formatTask(updatedTask);

    // Emit appropriate socket event
    const socketEvent = (status !== undefined && status !== existingTask.status) ? 'task:moved' : 'task:updated';
    emitToRoom(`project:${existingTask.project_id}`, socketEvent, formatted);

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const { data: task } = await supabase
      .from('tasks')
      .select('project_id, title')
      .eq('id', id)
      .single();

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, task.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Emit Socket delete event
    emitToRoom(`project:${task.project_id}`, 'task:deleted', { id });

    return res.status(200).json({ success: true, data: { id, message: 'Task deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function moveTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;
    const { status, order } = req.body;

    if (status === undefined || order === undefined) {
      return res.status(400).json({ success: false, error: 'Status and order are required' });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('project_id, status, title')
      .eq('id', id)
      .single();

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const role = await checkProjectAccess(req.user.id, task.project_id);
    if (!role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Project access required' });
    }

    // Update order and status
    const { error } = await supabase
      .from('tasks')
      .update({
        status,
        task_order: order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Fetch updated task with details
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('*, labels:task_labels(label), comments:task_comments(*, user:profiles(*))')
      .eq('id', id)
      .single();

    const formatted = formatTask(updatedTask);

    // Emit Socket task:moved event
    emitToRoom(`project:${task.project_id}`, 'task:moved', formatted);

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}
