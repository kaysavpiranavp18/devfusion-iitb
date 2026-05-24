import { Request } from 'express';
import { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'p0' | 'p1' | 'p2';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  skills: string[];
  github?: string;
  created_at: string;
  updated_at: string;
}
