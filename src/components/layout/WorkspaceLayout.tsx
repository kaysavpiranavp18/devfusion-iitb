import { type ReactNode, useEffect } from 'react';
import { useParams, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FileText, Code, Activity, Users, Settings, Plus,
  FolderOpen, CheckSquare, Home, Sparkles, PanelRightClose,
} from 'lucide-react';
import { useWorkspaceStore, useUIStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { AIAssistant } from '../ai/AIAssistant';
import { AICodeReview } from '../ai/AICodeReview';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWorkspace, setCurrentWorkspace, projects, fetchProjects } = useWorkspaceStore();
  const {
    sidebarOpen, toggleSidebar,
    aiSidebarOpen, activeAiModel, activeAiTab,
    toggleAiSidebar, setActiveAiModel, setActiveAiTab
  } = useUIStore();

  useEffect(() => {
    if (workspaceId) {
      const ws = useWorkspaceStore.getState().workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        fetchProjects(workspaceId);
      }
    }
    return () => setCurrentWorkspace(null);
  }, [workspaceId, setCurrentWorkspace, fetchProjects]);

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

  const activityBarItems = [
    { id: 'explorer', icon: FolderOpen, label: 'Workspace Explorer (Toggle Sidebar)' },
    { id: 'board', icon: LayoutDashboard, label: 'Kanban Board', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/board` : null },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks List', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/tasks` : null },
    { id: 'docs', icon: FileText, label: 'Docs Wiki', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/docs` : null },
    { id: 'snippets', icon: Code, label: 'Code Snippets', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/snippets` : null },
    { id: 'activity', icon: Activity, label: 'Activity Timeline', to: activeProjectId ? `/workspace/${workspaceId}/project/${activeProjectId}/activity` : null },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 text-body select-none bg-canvas">
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
        <div className={clsx(
          "bg-canvas border-r border-hairline flex flex-col shrink-0 overflow-y-auto transition-all duration-300",
          "fixed md:relative left-14 md:left-0 top-10 md:top-0 bottom-0 z-30 shadow-2xl md:shadow-none h-[calc(100vh-2.5rem)] md:h-full",
          sidebarOpen 
            ? "w-[220px] translate-x-0" 
            : "w-[220px] md:w-0 -translate-x-full md:translate-x-0 border-r-0 overflow-hidden"
        )}>
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
                
                return (
                  <NavLink
                    key={project.id}
                    to={dest}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-1.5 text-xs transition-colors rounded-md',
                      isActiveProject ? 'bg-white/10 text-ink font-medium' : 'text-muted hover:bg-surface-card',
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Members */}
          <div className="p-3 border-t border-hairline mt-auto">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Members</span>
              <Users size={12} className="text-muted" />
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
        <div className={clsx(
          "bg-canvas border-l border-hairline flex flex-col shrink-0 transition-all duration-300 overflow-hidden min-h-0 z-30",
          "fixed md:relative right-0 top-10 md:top-0 bottom-0 shadow-2xl md:shadow-none h-[calc(100vh-2.5rem)] md:h-auto",
          aiSidebarOpen 
            ? "w-80 md:w-96 translate-x-0" 
            : "w-80 md:w-0 translate-x-full md:translate-x-0 border-l-0"
        )}>
          {/* Header */}
          <div className="p-3 border-b border-hairline flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">DevCollab Copilot</span>
            </div>
            <button
              onClick={toggleAiSidebar}
              className="p-1 hover:bg-surface-card text-muted hover:text-ink transition-colors cursor-pointer rounded"
              title="Close panel"
            >
              <PanelRightClose size={14} />
            </button>
          </div>

          {/* Model Selector */}
          <div className="p-3 border-b border-hairline bg-surface-card/20 shrink-0">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-muted mb-1">
              AI MODEL
            </label>
            <select
              value={activeAiModel}
              onChange={(e) => setActiveAiModel(e.target.value)}
              className="w-full bg-surface-card border border-hairline text-ink text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Default)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>

          {/* Panel Switcher Tabs */}
          <div className="flex border-b border-hairline bg-canvas shrink-0">
            <button
              onClick={() => setActiveAiTab('assistant')}
              className={clsx(
                "flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer",
                activeAiTab === 'assistant' ? "border-primary text-ink bg-white/[0.02]" : "border-transparent text-muted hover:text-ink"
              )}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveAiTab('review')}
              className={clsx(
                "flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-150 cursor-pointer",
                activeAiTab === 'review' ? "border-primary text-ink bg-white/[0.02]" : "border-transparent text-muted hover:text-ink"
              )}
            >
              Code Review
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-canvas">
            {activeAiTab === 'assistant' ? (
              <AIAssistant projectId={projectId || projects[0]?.id || ''} />
            ) : (
              <AICodeReview compact />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
