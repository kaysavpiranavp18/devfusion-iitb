import { create } from 'zustand';
import type { Workspace, Project, User, Notification, Task, Snippet, TaskComment } from '../types';
import { workspaces as mockWorkspaces, projects as mockProjects, currentUser, tasks as mockTasks, snippets as mockSnippets, notifications as mockNotifs, users } from '../data/mock';
import { mockFiles } from '../data/mockFiles';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
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
  addWorkspace: (ws) => set((state) => {
    mockWorkspaces.push(ws);
    return { workspaces: [...state.workspaces, ws] };
  }),
  addProject: (project) => set((state) => {
    mockProjects.push(project);
    return { projects: [...state.projects, project] };
  }),
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
  addTask: (task) => set((state) => {
    const updatedTasks = [...state.tasks, task];
    
    // Notify!
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const assigneeUser = users.find(u => u.id === task.assigneeId);
      const assigneeName = assigneeUser ? assigneeUser.name : 'Unassigned';
      
      useNotificationsStore.getState().addNotification({
        id: `n-${Date.now()}`,
        userId: currentUser.id,
        title: 'Task Created',
        message: `New task '${task.title}' was assigned to ${assigneeName}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'task',
        link: `/workspace/w1/project/${task.projectId}/board`
      });
    }
    
    return { tasks: updatedTasks };
  }),
  addComment: (taskId, comment: TaskComment) => set((state) => {
    const updatedTasks = state.tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, comment as TaskComment] } : t);
    
    // Notify!
    const task = state.tasks.find(t => t.id === taskId);
    const currentUser = useAuthStore.getState().user;
    if (task && currentUser) {
      useNotificationsStore.getState().addNotification({
        id: `n-${Date.now()}`,
        userId: currentUser.id,
        title: 'New Comment',
        message: `${currentUser.name} commented on '${task.title}'`,
        read: false,
        createdAt: new Date().toISOString(),
        type: 'comment',
        link: `/workspace/w1/project/${task.projectId}/board`
      });
    }
    
    return { tasks: updatedTasks };
  }),
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
  addNotification: (notification: Notification) => void;
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
  addNotification: (notification) => set((state) => {
    const notifications = [notification, ...state.notifications];
    return { notifications, unreadCount: notifications.filter(n => !n.read).length };
  }),
}));

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark';
  aiSidebarOpen: boolean;
  activeAiModel: string;
  activeAiTab: 'assistant' | 'review';
  openFiles: string[];
  activeFile: string | null;
  fileContents: Record<string, string>;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleAiSidebar: () => void;
  setAiSidebarOpen: (open: boolean) => void;
  setActiveAiModel: (model: string) => void;
  setActiveAiTab: (tab: 'assistant' | 'review') => void;
  openFile: (fileName: string) => void;
  closeFile: (fileName: string) => void;
  setActiveFile: (fileName: string | null) => void;
  updateFileContent: (fileName: string, content: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  theme: 'light',
  aiSidebarOpen: false,
  activeAiModel: 'gemini-2.5-pro',
  activeAiTab: 'assistant',
  openFiles: ['App.tsx', 'README.md'],
  activeFile: 'App.tsx',
  fileContents: mockFiles,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setTheme: (theme) => set({ theme }),
  toggleAiSidebar: () => set((state) => ({ aiSidebarOpen: !state.aiSidebarOpen })),
  setAiSidebarOpen: (open) => set({ aiSidebarOpen: open }),
  setActiveAiModel: (model) => set({ activeAiModel: model }),
  setActiveAiTab: (tab) => set({ activeAiTab: tab }),
  openFile: (fileName) => set((state) => {
    const openFiles = state.openFiles.includes(fileName)
      ? state.openFiles
      : [...state.openFiles, fileName];
    return { openFiles, activeFile: fileName };
  }),
  closeFile: (fileName) => set((state) => {
    const openFiles = state.openFiles.filter((f) => f !== fileName);
    let activeFile = state.activeFile;
    if (activeFile === fileName) {
      activeFile = openFiles.length > 0 ? openFiles[openFiles.length - 1] : null;
    }
    return { openFiles, activeFile };
  }),
  setActiveFile: (fileName) => set({ activeFile: fileName }),
  updateFileContent: (fileName, content) => set((state) => ({
    fileContents: { ...state.fileContents, [fileName]: content }
  })),
}));

