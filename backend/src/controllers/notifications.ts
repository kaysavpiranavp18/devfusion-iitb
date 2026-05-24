import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

function formatNotification(n: any): any {
  return {
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    link: n.link || undefined,
    createdAt: n.created_at
  };
}

export async function getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const formatted = (notifications || []).map(formatNotification);
    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { id } = req.params;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: formatNotification(notification) });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
}
