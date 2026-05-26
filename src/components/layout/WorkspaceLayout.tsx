import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FileText, Code, Activity, Settings, Plus, Lock,
  FolderOpen, CheckSquare, Home, UserPlus,
} from 'lucide-react';
import { useWorkspaceStore, useUIStore, useAuthStore, useActivityStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { AIAssistant } from '../ai/AIAssistant';
import { LiveCursorPresence } from '../presence/LiveCursorPresence';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);
  const { currentWorkspace, setCurrentWorkspace, projects, fetchProjects, workspaces, fetchWorkspaces, loading } = useWorkspaceStore();
  const currentUserId = useAuthStore(state => state.user?.id);
  const {
    sidebarOpen, toggleSidebar,
    aiSidebarOpen, toggleAiSidebar
  } = useUIStore();

  const [leftWidth, setLeftWidth] = useState(220);
  const [rightWidth, setRightWidth] = useState(384);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // Invite teammates state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText('https://devcollab.app/invite/abc123xyz');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !currentWorkspace) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', inviteEmail.trim())
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        setToastMessage(`User with email ${inviteEmail.trim()} not found.`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      const alreadyMember = currentWorkspace.members.some(m => m.user.id === profile.id);
      if (alreadyMember) {
        setToastMessage(`${profile.name} is already a member.`);
        setTimeout(() => setToastMessage(null), 4000);
        return;
      }

      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: currentWorkspace.id,
          user_id: profile.id,
          role: inviteRole
        });

      if (memErr) throw memErr;

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        await useActivityStore.getState().addActivity(
          currentWorkspace.id,
          'member_joined',
          `${profile.name} joined the workspace`,
          profile.id
        );
      }

      await fetchWorkspaces();

      setIsInviteOpen(false);
      setToastMessage(`Successfully added ${profile.name} to the workspace.`);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to add workspace member.');
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        // Activity bar is 56px (w-14)
        const newWidth = e.clientX - 56;
        if (newWidth >= 160 && newWidth <= 450) {
          setLeftWidth(newWidth);
        }
      } else if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 600) {
          setRightWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingLeft || isResizingRight) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  useEffect(() => {
    if (workspaces.length === 0) {
      fetchWorkspaces();
    }
  }, [workspaces.length, fetchWorkspaces]);

  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        fetchProjects(workspaceId);
      }
    }
    return () => setCurrentWorkspace(null);
  }, [workspaceId, workspaces, setCurrentWorkspace, fetchProjects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (window.innerWidth < 768) {
          if (sidebarOpen) toggleSidebar();
          if (aiSidebarOpen) toggleAiSidebar();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, aiSidebarOpen, toggleSidebar, toggleAiSidebar]);

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        Workspace not found
      </div>
    );
  }

  const activeProjectId = projectId || (projects.length > 0 ? projects[0].id : null);
  const currentProject = projectId ? projects.find(project => project.id === projectId) || null : null;
  const hasProjectAccess = !currentProject || currentProject.members.some(member => member.user.id === currentUserId);
  const screenKey = projectId
    ? `project:${projectId}:${location.pathname.split('/').pop() || 'board'}`
    : 'overview';

  if (projectId && loading && !currentProject) {
    return (
      <div className="flex-1 flex flex-col min-h-0 text-body select-none bg-canvas">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-body">Loading project access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (projectId && !currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-canvas text-body">
        <div className="max-w-md w-full mx-4 p-6 border border-hairline bg-surface-card text-center space-y-3">
          <div className="w-12 h-12 mx-auto flex items-center justify-center bg-white/5 border border-hairline">
            <Lock size={18} className="text-muted" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Project not found</h1>
          <p className="text-sm text-muted">The requested project does not exist in this workspace.</p>
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/overview`)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  if (projectId && currentProject && !hasProjectAccess) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-canvas text-body">
        <div className="max-w-md w-full mx-4 p-6 border border-hairline bg-surface-card text-center space-y-3">
          <div className="w-12 h-12 mx-auto flex items-center justify-center bg-white/5 border border-hairline">
            <Lock size={18} className="text-semantic-warning" />
          </div>
          <h1 className="text-lg font-semibold text-ink">Project locked</h1>
          <p className="text-sm text-muted">
            You are in this workspace, but you were not granted access to this project.
          </p>
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/overview`)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  const activityBarItems = [
    { id: 'explorer', icon: FolderOpen, label: 'Workspace Explorer (Toggle Sidebar)' },
    { id: 'board', icon: LayoutDashboard, label: 'Kanban Board', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/board` : null },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks List', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/tasks` : null },
    { id: 'docs', icon: FileText, label: 'Docs Wiki', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/docs` : null },
    { id: 'snippets', icon: Code, label: 'Code Snippets', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/snippets` : null },
    { id: 'activity', icon: Activity, label: 'Activity Timeline', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/activity` : null },
  ];

  return (
    <div ref={shellRef} className="relative flex-1 flex flex-col min-h-0 text-body select-none bg-canvas">
      {workspaceId && screenKey && (
        <LiveCursorPresence
          workspaceId={workspaceId}
          screenKey={screenKey}
          containerRef={shellRef}
        />
      )}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* 1. Activity Bar (Far Left, narrow 56px rail) */}
        <div className="w-14 bg-canvas border-r border-hairline flex flex-col justify-between items-center py-3 shrink-0 z-20">
          {/* Top Icons */}
          <div className="flex flex-col gap-2 w-full items-center">
            {activityBarItems.map(item => {
              const isActive = item.id === 'explorer'
                ? sidebarOpen
                : (item.to ? location.pathname.includes(`/${item.id}`) : false);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'explorer') {
                      toggleSidebar();
                    } else if (item.to) {
                      navigate(item.to);
                    }
                  }}
                  className={clsx(
                    "relative w-10 h-10 flex items-center justify-center transition-all duration-150 cursor-pointer group rounded-lg hover:bg-white/[0.04]",
                    isActive ? "text-ink bg-white/10" : "text-muted hover:text-ink"
                  )}
                  title={item.label}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-primary rounded-r" />
                  )}
                  <item.icon size={18} />
                </button>
              );
            })}
          </div>

          {/* Bottom Icons */}
          <div className="flex flex-col gap-2 w-full items-center">
            {/* Workspace Settings / Overview */}
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/overview`)}
              className={clsx(
                "w-10 h-10 flex items-center justify-center transition-all duration-150 cursor-pointer rounded-lg hover:bg-white/[0.04]",
                location.pathname.includes('/overview') ? "text-ink bg-white/10" : "text-muted hover:text-ink"
              )}
              title="Workspace Settings"
            >
              <Settings size={18} />
            </button>

            {/* Back to Dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-all duration-150 cursor-pointer rounded-lg hover:bg-white/[0.04]"
              title="Back to Dashboard"
            >
              <Home size={18} />
            </button>
          </div>
        </div>

        {/* Backdrop for Explorer sidebar on mobile */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={toggleSidebar}
          />
        )}

        {/* 2. Left Explorer Sidebar (Collapsible, ~220px) */}
        <div
          style={sidebarOpen ? { width: `${leftWidth}px` } : { width: '0px' }}
          className={clsx(
            "bg-canvas border-r border-hairline flex flex-col shrink-0 overflow-y-auto relative",
            !isResizingLeft && "transition-all duration-300",
            "fixed md:relative left-14 md:left-0 top-10 md:top-0 bottom-0 z-30 shadow-2xl md:shadow-none h-[calc(100vh-2.5rem)] md:h-full",
            sidebarOpen 
              ? "translate-x-0" 
              : "-translate-x-full md:translate-x-0 border-r-0 overflow-hidden"
          )}
        >
          {/* Workspace Info */}
          <div className="p-4 border-b border-hairline">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={currentWorkspace.name} size="lg" className="rounded-lg" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-ink truncate">{currentWorkspace.name}</h2>
                <span className={clsx(
                  'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                  currentWorkspace.plan === 'pro' ? 'text-primary bg-primary/10 border border-primary/20' : 'text-muted bg-white/5 border border-white/10',
                )}>
                  {currentWorkspace.plan}
                </span>
              </div>
            </div>
            <div className="flex -space-x-1.5">
              {currentWorkspace.members.slice(0, 5).map(m => (
                <Avatar key={m.user.id} src={m.user.avatar} name={m.user.name} size="sm" className="border border-canvas" />
              ))}
              {currentWorkspace.members.length > 5 && (
                <div className="w-6 h-6 bg-surface-card border border-hairline flex items-center justify-center text-[10px] font-medium text-muted rounded-full">
                  +{currentWorkspace.members.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Projects</span>
              <button className="p-1 hover:bg-surface-card text-muted hover:text-ink rounded transition-colors">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map(project => {
                const currentView = location.pathname.split('/').pop() || 'board';
                const dest = `/workspace/${workspaceId}/project/${project.id}/${['board', 'tasks', 'docs', 'snippets', 'activity'].includes(currentView) ? currentView : 'board'}`;
                const isActiveProject = projectId === project.id;
                const hasAccess = project.members.some(member => member.user.id === currentUserId);
                
                return (
                  <NavLink
                    key={project.id}
                    to={dest}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded-md',
                      !hasAccess && 'opacity-60 cursor-not-allowed',
                      isActiveProject ? 'bg-white/10 text-ink font-medium' : 'text-muted hover:bg-surface-card',
                    )}
                    onClick={e => {
                      if (!hasAccess) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                    {!hasAccess && <Lock size={11} className="ml-auto shrink-0 text-semantic-warning" />}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Members */}
          <div className="p-3 border-t border-hairline mt-auto">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Members</span>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="p-1 hover:bg-surface-card hover:text-ink text-muted rounded transition-colors cursor-pointer border-none bg-transparent"
                title="Invite teammates"
              >
                <UserPlus size={13} />
              </button>
            </div>
            <div className="space-y-1">
              {currentWorkspace.members.map(m => (
                <div key={m.user.id} className="flex items-center gap-2 px-2 py-1 text-xs text-muted">
                  <Avatar src={m.user.avatar} name={m.user.name} size="sm" className="w-5 h-5" />
                  <span className="truncate flex-1">{m.user.name}</span>
                  <span className="text-[9px] uppercase font-bold text-muted bg-white/5 px-1 py-0.5 rounded">{m.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resize Handle */}
          {sidebarOpen && (
            <div
              onMouseDown={startResizeLeft}
              className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 select-none group"
            >
              {/* Top and Bottom Corner grab notches */}
              <div className="absolute top-4 right-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              </div>
              <div className="absolute bottom-4 right-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Main Content Area (Center) */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-canvas">
          <div className="flex-1 overflow-auto bg-canvas">
            {children}
          </div>
        </div>

        {/* Backdrop for AI sidebar on mobile */}
        {aiSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
            onClick={toggleAiSidebar}
          />
        )}

        {/* 4. AI Copilot Sidebar (Collapsible, Far Right) */}
        <div
          style={aiSidebarOpen ? { width: `${rightWidth}px` } : { width: '0px' }}
          className={clsx(
            "bg-[#070a10] border-l border-hairline flex flex-col shrink-0 overflow-hidden min-h-0 z-30 relative",
            !isResizingRight && "transition-all duration-300",
            "fixed md:relative right-0 top-10 md:top-0 bottom-0 shadow-2xl md:shadow-none h-[calc(100vh-2.5rem)] md:h-auto",
            aiSidebarOpen 
              ? "translate-x-0" 
              : "translate-x-full md:translate-x-0 border-l-0"
          )}
        >
          {/* Resize Handle */}
          {aiSidebarOpen && (
            <div
              onMouseDown={startResizeRight}
              className="hidden md:block absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors z-50 select-none group"
            >
              {/* Top and Bottom Corner grab notches */}
              <div className="absolute top-4 left-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              </div>
              <div className="absolute bottom-4 left-0.5 flex gap-[1px] items-center justify-center opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
                <div className="w-[1.5px] h-3.5 bg-gray-500 rounded-full" />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0 bg-[#070a10] flex flex-col">
            <AIAssistant projectId={projectId || projects[0]?.id || ''} />
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite to workspace"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer focus:outline-none"
            >
              <option value="member" className="bg-[#0a0a0f]">Member</option>
              <option value="admin" className="bg-[#0a0a0f]">Admin</option>
              <option value="viewer" className="bg-[#0a0a0f]">Viewer</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-3.5 py-1.5 border border-hairline hover:bg-white/5 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 bg-transparent"
            >
              {copiedLink ? "Link copied!" : "Copy Invite Link"}
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-[#8b949e] hover:text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={!inviteEmail.trim()}
                className="px-3.5 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#13131a] border border-[#1e1e2e] text-ink text-xs px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 border-l-4 border-l-[#6366f1]">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
