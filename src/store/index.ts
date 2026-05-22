import { create } from 'zustand';
import type { Workspace, Project, User, Notification, Task, Snippet, TaskComment } from '../types';
import { workspaces as mockWorkspaces, projects as mockProjects, currentUser, tasks as mockTasks, snippets as mockSnippets, notifications as mockNotifs } from '../data/mock';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: currentUser,
  isAuthenticated: true,
  login: async () => {
    set({ user: currentUser, isAuthenticated: true });
    return true;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  updateProfile: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
}));

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  loading: boolean;
  fetchWorkspaces: () => void;
  setCurrentWorkspace: (ws: Workspace | null) => void;
  fetchProjects: (workspaceId: string) => void;
  addWorkspace: (ws: Workspace) => void;
  addProject: (project: Project) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: mockWorkspaces,
  currentWorkspace: null,
  projects: [],
  loading: false,
  fetchWorkspaces: () => set({ workspaces: mockWorkspaces }),
  setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),
  fetchProjects: (workspaceId) => set({
    projects: mockProjects.filter(p => p.workspaceId === workspaceId),
  }),
  addWorkspace: (ws) => set((state) => ({ workspaces: [...state.workspaces, ws] })),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
}));

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  updateTaskOrder: (taskId: string, order: number) => void;
  addTask: (task: Task) => void;
  addComment: (taskId: string, comment: TaskComment) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: mockTasks,
  setTasks: (tasks) => set({ tasks }),
  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t),
  })),
  updateTaskOrder: (taskId, order) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, order } : t),
  })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  addComment: (taskId, comment: TaskComment) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, comment as TaskComment] } : t),
  })),
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t),
  })),
}));

interface SnippetState {
  snippets: Snippet[];
  addSnippet: (snippet: Snippet) => void;
  deleteSnippet: (id: string) => void;
}

export const useSnippetStore = create<SnippetState>((set) => ({
  snippets: mockSnippets,
  addSnippet: (snippet) => set((state) => ({ snippets: [...state.snippets, snippet] })),
  deleteSnippet: (id) => set((state) => ({ snippets: state.snippets.filter(s => s.id !== id) })),
}));

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: mockNotifs,
  unreadCount: mockNotifs.filter(n => !n.read).length,
  markAsRead: (id) => set((state) => {
    const notifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    return { notifications, unreadCount: notifications.filter(n => !n.read).length };
  }),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

