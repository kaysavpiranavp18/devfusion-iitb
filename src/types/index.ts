// =============== User & Auth ===============
export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  skills: string[];
  github?: string;
  createdAt: string;
}

export interface WorkspaceMember {
  user: User;
  role: Role;
  joinedAt: string;
}

// =============== Workspace & Project ===============
export interface Workspace {
  id: string;
  name: string;
  description: string;
  logo?: string;
  ownerId: string;
  members: WorkspaceMember[];
  projects: string[]; // project IDs
  createdAt: string;
  plan: 'free' | 'pro';
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

// =============== Tasks & Kanban ===============
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'p0' | 'p1' | 'p2';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  dueDate?: string;
  labels: string[];
  attachments: string[];
  comments: TaskComment[];
  order: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[]; // user IDs
  createdAt: string;
}

// =============== Code Snippets ===============
export interface Snippet {
  id: string;
  projectId: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============== Documentation ===============
export interface DocPage {
  id: string;
  projectId: string;
  title: string;
  content: string; // rich text HTML/JSON
  linkedPages: string[]; // page IDs
  parentId?: string;
  version: number;
  versions: DocVersion[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocVersion {
  version: number;
  content: string;
  updatedBy: string;
  updatedAt: string;
}

// =============== Activity ===============
export type ActivityType = 
  | 'task_moved' | 'task_created' | 'task_updated'
  | 'comment_added' | 'doc_updated' | 'doc_created'
  | 'member_joined' | 'snippet_added' 
  | 'task_assigned' | 'mention';

export interface Activity {
  id: string;
  workspaceId: string;
  projectId?: string;
  type: ActivityType;
  message: string;
  userId: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

// =============== Notifications ===============
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'mention' | 'assignment' | 'task_update' | 'invite' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

// =============== AI ===============
export interface AIReviewResult {
  bugs: string[];
  performance: string[];
  readability: string[];
  security: string[];
  score: number;
  suggestions: string[];
}

// =============== Payments ===============
export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    workspaces: number;
    projects: number;
    members: number;
    ai: boolean;
  };
}

// =============== Live Presence ===============
export interface PresenceInfo {
  userId: string;
  userName: string;
  avatar: string;
  entityId: string; // board, task, doc id
  entityType: 'board' | 'task' | 'doc';
}
