import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: err.message || 'Unauthorized' });
  }
}
