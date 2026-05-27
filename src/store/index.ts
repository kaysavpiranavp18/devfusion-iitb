import { create } from 'zustand';
import type { Workspace, Project, Notification, Task, Snippet, TaskComment, DocPage, Activity, Role } from '../types';
import { mockFiles } from '../data/mockFiles';
import { supabase } from '../lib/supabase';
import { backendJson } from '../lib/api';

interface AuthState {
  user: any | null;
  profile: any | null;
  profiles: Record<string, any>;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<any>;
  fetchProfiles: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    user: null,
    profile: null,
    profiles: {},
    loading: true,
    isAuthenticated: false,

    signUp: async (email, password, name) => {
      set({ loading: true });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          // Immediately insert into profiles table
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email || email,
            name: name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            skills: [],
          });
          if (profileError) {
            console.error('Error inserting profile:', profileError);
          }
          if (!data.session) {
            throw new Error('Verification email sent! Please check your inbox to verify your email and sign in.');
          }
          set({ user: data.user, isAuthenticated: true });
          await get().fetchProfile();
        }
      } finally {
        set({ loading: false });
      }
    },

    signIn: async (email, password) => {
      set({ loading: true });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ user: data.user, isAuthenticated: true });
        await get().fetchProfile();
      } finally {
        set({ loading: false });
      }
    },

    signInWithGoogle: async () => {
      set({ loading: true });
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/dashboard'
          }
        });
        if (error) throw error;
      } finally {
        set({ loading: false });
      }
    },

    signInWithGitHub: async () => {
      set({ loading: true });
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: window.location.origin + '/dashboard'
          }
        });
        if (error) throw error;
      } finally {
        set({ loading: false });
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        // Clear auth state defensively first
        set({ user: null, profile: null, isAuthenticated: false });

        // Attempt Supabase sign out
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error('Supabase signOut error:', err);
        }

        // Reset all other stores to initial empty state
        if (typeof useWorkspaceStore !== 'undefined') {
          useWorkspaceStore.setState({ workspaces: [], currentWorkspace: null, projects: [], loading: false });
        }
        if (typeof useTaskStore !== 'undefined') {
          useTaskStore.setState({ tasks: [], loading: false });
        }
        if (typeof useSnippetStore !== 'undefined') {
          useSnippetStore.setState({ snippets: [], loading: false });
        }
        if (typeof useNotificationsStore !== 'undefined') {
          useNotificationsStore.setState({ notifications: [], unreadCount: 0, loading: false });
        }
        if (typeof useDocsStore !== 'undefined') {
          useDocsStore.setState({ docs: [], loading: false });
        }
        if (typeof useActivityStore !== 'undefined') {
          useActivityStore.setState({ activities: [], loading: false });
        }
      } finally {
        set({ loading: false });
      }
    },

    fetchProfile: async () => {
      const userObj = get().user;
      console.log('[Store] fetchProfile starting... userObj:', userObj ? userObj.email : 'null');
      if (!userObj) {
        console.log('[Store] fetchProfile userObj is null, setting loading to false');
        set({ loading: false });
        return null;
      }
      try {
        console.log('[Store] fetchProfile querying profiles table for ID:', userObj.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userObj.id)
          .single();
        
        console.log('[Store] fetchProfile profiles query complete. data:', data, 'error:', error);
        if (error) {
          // If profile row doesn't exist, create it (e.g. for Google OAuth logins or debug users)
          if (error.code === 'PGRST116') {
            console.log('[Store] fetchProfile profile not found (PGRST116), inserting default profile...');
            const defaultProfile = {
              id: userObj.id,
              email: userObj.email || '',
              name: userObj.user_metadata?.full_name || userObj.email?.split('@')[0] || 'User',
              avatar: userObj.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userObj.email || userObj.id}`,
              skills: [],
            };
            const insertResult = await supabase.from('profiles').insert(defaultProfile);
            console.log('[Store] fetchProfile profile insert result:', insertResult);
            set((state) => ({
              profile: defaultProfile,
              profiles: { ...state.profiles, [userObj.id]: defaultProfile },
              user: {
                ...userObj,
                ...defaultProfile,
                createdAt: userObj.created_at || new Date().toISOString()
              }
            }));
            return defaultProfile;
          }
          console.error('[Store] Error fetching profile:', error);
          return null;
        }
        
        // Expose profile fields on the user object too so we don't break existing page designs
        console.log('[Store] fetchProfile profile found, setting state...');
        set((state) => ({
          profile: data,
          profiles: { ...state.profiles, [userObj.id]: data },
          user: {
            ...userObj,
            ...data,
            createdAt: userObj.created_at || new Date().toISOString()
          }
        }));
        return data;
      } catch (err) {
        console.error('[Store] fetchProfile failed:', err);
        return null;
      } finally {
        console.log('[Store] fetchProfile finally: setting loading to false');
        set({ loading: false });
      }
    },

    fetchProfiles: async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        const profilesMap: Record<string, any> = {};
        if (data) {
          data.forEach(p => {
            profilesMap[p.id] = {
              id: p.id,
              name: p.name,
              email: p.email,
              avatar: p.avatar,
              bio: p.bio,
              skills: p.skills || [],
              github: p.github,
              createdAt: p.created_at
            };
          });
        }
        set((state) => ({
          profiles: { ...state.profiles, ...profilesMap }
        }));
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    },

    login: async (email, password) => {
      await get().signIn(email, password);
      return !!get().user;
    },

    logout: async () => {
      await get().signOut();
    },

    updateProfile: async (updates) => {
      const userObj = get().user;
      if (!userObj) return;

      // Optimistic update
      set((state) => {
        const nextProfile = state.profile ? { ...state.profile, ...updates } : null;
        return {
          profile: nextProfile,
          profiles: nextProfile ? { ...state.profiles, [userObj.id]: nextProfile } : state.profiles,
          user: state.user ? { ...state.user, ...updates } : null
        };
      });

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userObj.id);

      if (error) {
        console.error('Error updating profile:', error);
      }
      await get().fetchProfile();
    }
  };
});

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  projects: Project[];
  loading: boolean;
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (ws: Workspace | null) => void;
  fetchProjects: (workspaceId: string) => Promise<void>;
  addWorkspace: (ws: Workspace) => Promise<void>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  removeWorkspaceMember: (workspaceId: string, userId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  projects: [],
  loading: false,

  fetchWorkspaces: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const { data: memberRows } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);

      const { data: ownedRows } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id);

      const wsIds = Array.from(new Set([
        ...(memberRows || []).map(r => r.workspace_id),
        ...(ownedRows || []).map(r => r.id)
      ]));

      if (wsIds.length === 0) {
        set({ workspaces: [], currentWorkspace: null });
        return;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members (
            role,
            joined_at,
            profiles (
              id,
              name,
              email,
              avatar,
              bio,
              skills,
              github,
              created_at
            )
          ),
          projects (
            id
          )
        `)
        .in('id', wsIds);

      if (error) throw error;

      const profilesMap: Record<string, any> = {};
      const formatted: Workspace[] = (data || []).map((ws: any) => {
        const members = (ws.workspace_members || []).map((m: any) => {
          const profile = m.profiles;
          if (profile) {
            profilesMap[profile.id] = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar,
              bio: profile.bio,
              skills: profile.skills || [],
              github: profile.github,
              createdAt: profile.created_at
            };
          }
          return {
            user: {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar: profile.avatar,
              bio: profile.bio,
              skills: profile.skills || [],
              github: profile.github,
              createdAt: profile.created_at
            },
            role: m.role as Role,
            joinedAt: m.joined_at
          };
        });

        return {
          id: ws.id,
          name: ws.name,
          description: ws.description,
          logo: ws.logo || undefined,
          ownerId: ws.owner_id,
          members,
          projects: (ws.projects || []).map((p: any) => p.id),
          createdAt: ws.created_at,
          plan: ws.plan
        };
      });

      useAuthStore.setState((state) => ({
        profiles: { ...state.profiles, ...profilesMap }
      }));

      set({ workspaces: formatted });

      const active = get().currentWorkspace;
      if (active) {
        const updatedActive = formatted.find(w => w.id === active.id) || null;
        set({ currentWorkspace: updatedActive });
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      set({ loading: false });
    }
  },

  setCurrentWorkspace: (ws) => set({ currentWorkspace: ws }),

  fetchProjects: async (workspaceId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members (
            role,
            joined_at,
            profiles (
              id,
              name,
              email,
              avatar,
              bio,
              skills,
              github,
              created_at
            )
          )
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      const formatted: Project[] = (data || []).map((p: any) => {
        const members = (p.project_members || []).map((m: any) => ({
          user: {
            id: m.profiles.id,
            name: m.profiles.name,
            email: m.profiles.email,
            avatar: m.profiles.avatar,
            bio: m.profiles.bio,
            skills: m.profiles.skills || [],
            github: m.profiles.github,
            createdAt: m.profiles.created_at
          },
          role: m.role as Role,
          joinedAt: m.joined_at
        }));

        return {
          id: p.id,
          workspaceId: p.workspace_id,
          name: p.name,
          description: p.description,
          color: p.color,
          members,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        };
      });

      set({ projects: formatted });
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      set({ loading: false });
    }
  },

  addWorkspace: async (ws) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: ws.name,
          description: ws.description,
          logo: ws.logo,
          owner_id: ws.ownerId,
          plan: ws.plan
        })
        .select()
        .single();

      if (error) throw error;

      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: data.id,
          user_id: ws.ownerId,
          role: 'owner'
        });

      if (memErr) throw memErr;

      await get().fetchWorkspaces();
    } catch (err) {
      console.error('Error adding workspace:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  addProject: async (project) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: project.workspaceId,
          name: project.name,
          description: project.description,
          color: project.color
        })
        .select()
        .single();

      if (error) throw error;

      const user = useAuthStore.getState().user;
      if (user) {
        const { error: memErr } = await supabase
          .from('project_members')
          .insert({
            project_id: data.id,
            user_id: user.id,
            role: 'owner'
          });
        if (memErr) throw memErr;
      }

      await get().fetchProjects(project.workspaceId);
      await get().fetchWorkspaces();
    } catch (err) {
      console.error('Error adding project:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateProject: async (projectId, updates) => {
    set({ loading: true });
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', projectId);

      if (error) throw error;

      // Re-fetch for the workspace that owns this project
      const project = get().projects.find(p => p.id === projectId);
      if (project) {
        await get().fetchProjects(project.workspaceId);
      }
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true });
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) return;

      await backendJson(`/projects/${projectId}`, {
        method: 'DELETE'
      });

      await get().fetchProjects(project.workspaceId);
      await get().fetchWorkspaces();
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateWorkspace: async (workspaceId, updates) => {
    set({ loading: true });
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('workspaces')
        .update(dbUpdates)
        .eq('id', workspaceId);

      if (error) throw error;

      await get().fetchWorkspaces();
    } catch (err) {
      console.error('Error updating workspace:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteWorkspace: async (workspaceId) => {
    set({ loading: true });
    try {
      await backendJson(`/workspaces/${workspaceId}`, {
        method: 'DELETE'
      });

      set((state) => ({
        workspaces: state.workspaces.filter(w => w.id !== workspaceId),
        currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace
      }));
    } catch (err) {
      console.error('Error deleting workspace:', err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  removeWorkspaceMember: async (workspaceId, userId) => {
    try {
      await backendJson(`/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE'
      });

      await get().fetchWorkspaces();
    } catch (err) {
      console.error('Error removing workspace member:', err);
      throw err;
    }
  }
}));

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (projectId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  updateTaskOrder: (taskId: string, order: number) => Promise<void>;
  moveTask: (
    taskId: string, 
    newStatus: Task['status'], 
    newOrder: number, 
    affectedTasks: { id: string; status: Task['status']; order: number }[]
  ) => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  addComment: (taskId: string, comment: TaskComment) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_comments (
            *
          ),
          task_labels (
            label
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const formatted: Task[] = (data || []).map((t: any) => ({
        id: t.id,
        projectId: t.project_id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assignee_id || undefined,
        dueDate: t.due_date || undefined,
        labels: (t.task_labels || []).map((l: any) => l.label),
        attachments: t.attachments || [],
        comments: (t.task_comments || []).map((c: any) => ({
          id: c.id,
          taskId: c.task_id,
          userId: c.user_id,
          content: c.content,
          mentions: c.mentions || [],
          createdAt: c.created_at
        })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        order: t.task_order,
        createdBy: t.created_by,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }));

      set({ tasks: formatted });
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateTaskStatus: async (taskId, status) => {
    alert(`updateTaskStatus called for ID: ${taskId}, status: ${status}`);
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t)
    }));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      const task = get().tasks.find(t => t.id === taskId);
      const user = useAuthStore.getState().user;
      if (task && user) {
        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        if (workspaceId) {
          await useActivityStore.getState().addActivity(
            workspaceId,
            'task_moved',
            `${user.user_metadata?.full_name || user.email || 'Someone'} moved "${task.title}" to ${status.replace('_', ' ')}`,
            user.id,
            task.projectId
          );
        }
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);
      alert('Error updating task status: ' + (err.message || err.code || JSON.stringify(err)));
    }
  },

  updateTaskOrder: async (taskId, order) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, order } : t)
    }));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ task_order: order })
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating task order:', err);
    }
  },

  moveTask: async (taskId, newStatus, _newOrder, affectedTasks) => {
    set((state) => ({
      tasks: state.tasks.map(t => {
        const affected = affectedTasks.find(at => at.id === t.id);
        if (affected) {
          return {
            ...t,
            status: affected.status,
            order: affected.order,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    }));

    try {
      const promises = affectedTasks.map(task =>
        supabase
          .from('tasks')
          .update({
            status: task.status,
            task_order: task.order,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)
      );

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res.error) throw res.error;
      }

      const task = get().tasks.find(t => t.id === taskId);
      const user = useAuthStore.getState().user;
      if (task && user) {
        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        if (workspaceId) {
          await useActivityStore.getState().addActivity(
            workspaceId,
            'task_moved',
            `${user.user_metadata?.full_name || user.email || 'Someone'} moved "${task.title}" to ${newStatus.replace('_', ' ')}`,
            user.id,
            task.projectId
          );
        }
      }
    } catch (err) {
      console.error('Error updating tasks on drag and drop:', err);
    }
  },

  addTask: async (task) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: task.projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee_id: task.assigneeId || null,
          due_date: task.dueDate || null,
          attachments: task.attachments || [],
          task_order: task.order,
          created_by: task.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      if (task.labels && task.labels.length > 0) {
        const { error: labelErr } = await supabase
          .from('task_labels')
          .insert(task.labels.map(l => ({ task_id: data.id, label: l })));
        if (labelErr) throw labelErr;
      }

      const currentUser = useAuthStore.getState().user;
      if (currentUser && task.assigneeId) {
        await useNotificationsStore.getState().addNotification({
          id: `n-${Date.now()}`,
          userId: task.assigneeId,
          title: 'Task Assigned',
          message: `New task '${task.title}' was assigned to you`,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'assignment',
          link: `/workspace/${useWorkspaceStore.getState().currentWorkspace?.id}/project/${task.projectId}/board`
        });
      }

      const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
      if (workspaceId && currentUser) {
        await useActivityStore.getState().addActivity(
          workspaceId,
          'task_created',
          `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} created task "${task.title}"`,
          currentUser.id,
          task.projectId
        );
      }

      await get().fetchTasks(task.projectId);
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      set({ loading: false });
    }
  },

  addComment: async (taskId, comment) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: comment.userId,
          content: comment.content,
          mentions: comment.mentions || []
        });

      if (error) throw error;

      const task = get().tasks.find(t => t.id === taskId);
      const currentUser = useAuthStore.getState().user;
      if (task && currentUser) {
        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        
        if (workspaceId) {
          await useActivityStore.getState().addActivity(
            workspaceId,
            'comment_added',
            `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} commented on "${task.title}"`,
            currentUser.id,
            task.projectId
          );
        }

        // Notify task assignee/creator
        const notifyUser = task.assigneeId || task.createdBy;
        if (notifyUser && notifyUser !== currentUser.id) {
          await useNotificationsStore.getState().addNotification({
            id: `n-${Date.now()}`,
            userId: notifyUser,
            title: 'New Comment',
            message: `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} commented on '${task.title}'`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'comment',
            link: `/workspace/${workspaceId}/project/${task.projectId}/board`
          });
        }

        // Notify mentioned users
        if (comment.mentions && comment.mentions.length > 0) {
          for (const mentionedUserId of comment.mentions) {
            if (mentionedUserId !== currentUser.id && mentionedUserId !== notifyUser) {
              await useNotificationsStore.getState().addNotification({
                id: `n-${Date.now()}-${mentionedUserId}`,
                userId: mentionedUserId,
                title: 'You were mentioned',
                message: `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} mentioned you in a comment on '${task.title}'`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'mention',
                link: `/workspace/${workspaceId}/project/${task.projectId}/board`
              });
            }
          }
        }
      }

      if (task) {
        await get().fetchTasks(task.projectId);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId || null;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
      if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;
      if (updates.order !== undefined) dbUpdates.task_order = updates.order;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;

      if (updates.labels !== undefined) {
        await supabase.from('task_labels').delete().eq('task_id', taskId);
        if (updates.labels.length > 0) {
          const { error: labelErr } = await supabase
            .from('task_labels')
            .insert(updates.labels.map(l => ({ task_id: taskId, label: l })));
          if (labelErr) throw labelErr;
        }
      }

      const task = get().tasks.find(t => t.id === taskId);
      const currentUser = useAuthStore.getState().user;

      // Log activity for task update
      if (task && currentUser) {
        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        if (workspaceId) {
          await useActivityStore.getState().addActivity(
            workspaceId,
            'task_updated',
            `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} updated task "${updates.title || task.title}"`,
            currentUser.id,
            task.projectId
          );
        }

        // Notify new assignee if assignee changed
        if (updates.assigneeId && updates.assigneeId !== task.assigneeId && updates.assigneeId !== currentUser.id) {
          const wsId = useWorkspaceStore.getState().currentWorkspace?.id;
          await useNotificationsStore.getState().addNotification({
            id: `n-${Date.now()}`,
            userId: updates.assigneeId,
            title: 'Task Assigned',
            message: `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} assigned you to '${updates.title || task.title}'`,
            read: false,
            createdAt: new Date().toISOString(),
            type: 'assignment',
            link: `/workspace/${wsId}/project/${task.projectId}/board`
          });
        }
      }

      if (task) {
        await get().fetchTasks(task.projectId);
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true });
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      const currentUser = useAuthStore.getState().user;
      const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
      if (workspaceId && currentUser) {
        await useActivityStore.getState().addActivity(
          workspaceId,
          'task_updated',
          `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} deleted task "${task.title}"`,
          currentUser.id,
          task.projectId
        );
      }

      await get().fetchTasks(task.projectId);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      set({ loading: false });
    }
  }
}));

interface SnippetState {
  snippets: Snippet[];
  loading: boolean;
  fetchSnippets: (projectId: string) => Promise<void>;
  addSnippet: (snippet: Snippet) => Promise<void>;
  updateSnippet: (snippetId: string, updates: Partial<Snippet>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  loading: false,

  fetchSnippets: async (projectId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select(`
          *,
          snippet_tags (
            tag
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const formatted: Snippet[] = (data || []).map((s: any) => ({
        id: s.id,
        projectId: s.project_id,
        title: s.title,
        filename: s.filename || undefined,
        code: s.code,
        language: s.language,
        tags: (s.snippet_tags || []).map((t: any) => t.tag),
        description: s.description,
        createdBy: s.created_by,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));

      set({ snippets: formatted });
    } catch (err) {
      console.error('Error fetching snippets:', err);
    } finally {
      set({ loading: false });
    }
  },

  addSnippet: async (snippet) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('snippets')
        .insert({
          project_id: snippet.projectId,
          title: snippet.title,
          filename: snippet.filename || null,
          code: snippet.code,
          language: snippet.language,
          description: snippet.description,
          created_by: snippet.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      if (snippet.tags && snippet.tags.length > 0) {
        const { error: tagErr } = await supabase
          .from('snippet_tags')
          .insert(snippet.tags.map(t => ({ snippet_id: data.id, tag: t })));
        if (tagErr) throw tagErr;
      }

      const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
      const currentUser = useAuthStore.getState().user;
      if (workspaceId && currentUser) {
        await useActivityStore.getState().addActivity(
          workspaceId,
          'snippet_added',
          `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} added snippet "${snippet.title}"`,
          currentUser.id,
          snippet.projectId
        );
      }

      await get().fetchSnippets(snippet.projectId);
    } catch (err) {
      console.error('Error adding snippet:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateSnippet: async (snippetId, updates) => {
    set({ loading: true });
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.language !== undefined) dbUpdates.language = updates.language;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.filename !== undefined) dbUpdates.filename = updates.filename || null;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('snippets')
        .update(dbUpdates)
        .eq('id', snippetId);

      if (error) throw error;

      // Sync tags
      if (updates.tags !== undefined) {
        await supabase.from('snippet_tags').delete().eq('snippet_id', snippetId);
        if (updates.tags.length > 0) {
          const { error: tagErr } = await supabase
            .from('snippet_tags')
            .insert(updates.tags.map(t => ({ snippet_id: snippetId, tag: t })));
          if (tagErr) throw tagErr;
        }
      }

      const snippet = get().snippets.find(s => s.id === snippetId);
      if (snippet) {
        await get().fetchSnippets(snippet.projectId);
      }
    } catch (err) {
      console.error('Error updating snippet:', err);
    } finally {
      set({ loading: false });
    }
  },

  deleteSnippet: async (id) => {
    set({ loading: true });
    try {
      const snippet = get().snippets.find(s => s.id === id);
      if (!snippet) return;

      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await get().fetchSnippets(snippet.projectId);
    } catch (err) {
      console.error('Error deleting snippet:', err);
    } finally {
      set({ loading: false });
    }
  }
}));

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        link: n.link || undefined,
        createdAt: n.created_at
      }));

      set({
        notifications: formatted,
        unreadCount: formatted.filter(n => !n.read).length
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    set((state) => {
      const list = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      return {
        notifications: list,
        unreadCount: list.filter(n => !n.read).length
      };
    });

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  },

  addNotification: async (notification) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          link: notification.link || null
        });

      if (error) throw error;

      await get().fetchNotifications();
    } catch (err) {
      console.error('Error adding notification:', err);
    }
  }
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

interface DocsState {
  docs: DocPage[];
  loading: boolean;
  fetchDocs: (projectId: string) => Promise<void>;
  addDoc: (doc: DocPage) => Promise<string | undefined>;
  updateDoc: (docId: string, updates: Partial<DocPage>) => Promise<void>;
  deleteDoc: (docId: string) => Promise<void>;
}

export const useDocsStore = create<DocsState>((set, get) => ({
  docs: [],
  loading: false,

  fetchDocs: async (projectId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('wiki_pages')
        .select(`
          *,
          wiki_page_versions (
            *
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;

      const formatted: DocPage[] = (data || []).map((doc: any) => {
        const versions = (doc.wiki_page_versions || []).map((v: any) => ({
          version: v.version,
          content: v.content,
          updatedBy: v.updated_by,
          updatedAt: v.updated_at
        })).sort((a: any, b: any) => b.version - a.version);

        return {
          id: doc.id,
          projectId: doc.project_id,
          title: doc.title,
          content: doc.content,
          linkedPages: doc.linked_pages || [],
          parentId: doc.parent_id || undefined,
          version: doc.version,
          versions,
          createdBy: doc.created_by,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at
        };
      });

      set({ docs: formatted });
    } catch (err) {
      console.error('Error fetching docs:', err);
    } finally {
      set({ loading: false });
    }
  },

  addDoc: async (doc) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('wiki_pages')
        .insert({
          project_id: doc.projectId,
          title: doc.title,
          content: doc.content,
          linked_pages: doc.linkedPages || [],
          parent_id: doc.parentId || null,
          version: doc.version,
          created_by: doc.createdBy
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('wiki_page_versions').insert({
        wiki_page_id: data.id,
        version: 1,
        content: doc.content,
        updated_by: doc.createdBy
      });

      const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
      const currentUser = useAuthStore.getState().user;
      if (workspaceId && currentUser) {
        await useActivityStore.getState().addActivity(
          workspaceId,
          'doc_created',
          `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} created page "${doc.title}"`,
          currentUser.id,
          doc.projectId
        );
      }

      await get().fetchDocs(doc.projectId);
      return data.id;
    } catch (err) {
      console.error('Error adding doc:', err);
      return undefined;
    } finally {
      set({ loading: false });
    }
  },

  updateDoc: async (docId, updates) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.version !== undefined) dbUpdates.version = updates.version;
      if (updates.linkedPages !== undefined) dbUpdates.linked_pages = updates.linkedPages;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('wiki_pages')
        .update(dbUpdates)
        .eq('id', docId);

      if (error) throw error;

      const doc = get().docs.find(d => d.id === docId);
      if (doc) {
        if (updates.content !== undefined) {
          const currentUser = useAuthStore.getState().user;
          await supabase.from('wiki_page_versions').insert({
            wiki_page_id: docId,
            version: (updates.version || doc.version),
            content: updates.content,
            updated_by: currentUser?.id || doc.createdBy
          });
        }

        const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id;
        const currentUser = useAuthStore.getState().user;
        if (workspaceId && currentUser) {
          await useActivityStore.getState().addActivity(
            workspaceId,
            'doc_updated',
            `${currentUser.user_metadata?.full_name || currentUser.email || 'Someone'} updated page "${updates.title || doc.title}"`,
            currentUser.id,
            doc.projectId
          );
        }

        await get().fetchDocs(doc.projectId);
      }
    } catch (err) {
      console.error('Error updating doc:', err);
    }
  },

  deleteDoc: async (docId) => {
    set({ loading: true });
    try {
      const doc = get().docs.find(d => d.id === docId);
      if (!doc) return;

      const { error } = await supabase
        .from('wiki_pages')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      await get().fetchDocs(doc.projectId);
    } catch (err) {
      console.error('Error deleting doc:', err);
    } finally {
      set({ loading: false });
    }
  }
}));

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  fetchActivities: (workspaceId: string, projectId?: string) => Promise<void>;
  addActivity: (workspaceId: string, type: Activity['type'], message: string, userId: string, projectId?: string, metadata?: any) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  loading: false,

  fetchActivities: async (workspaceId, projectId) => {
    set({ loading: true });
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Activity[] = (data || []).map((a: any) => ({
        id: a.id,
        workspaceId: a.workspace_id,
        projectId: a.project_id || undefined,
        type: a.type,
        message: a.message,
        userId: a.user_id,
        metadata: a.metadata || undefined,
        createdAt: a.created_at
      }));

      set({ activities: formatted });
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      set({ loading: false });
    }
  },

  addActivity: async (workspaceId, type, message, userId, projectId, metadata) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          type,
          message,
          user_id: userId,
          metadata: metadata || {}
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error adding activity log:', err);
    }
  }
}));


