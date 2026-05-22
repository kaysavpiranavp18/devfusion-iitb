import { type ReactNode, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FileText, Code, Activity, Users, Settings, Plus,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { TopNav } from './TopNav';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, setCurrentWorkspace, projects, fetchProjects } = useWorkspaceStore();

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

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        Workspace not found
      </div>
    );
  }

  const projectTabs = projectId ? [{to: `board`, icon: LayoutDashboard, label: 'Board'},
    { to: `tasks`, icon: FileText, label: 'Tasks' },
    { to: `docs`, icon: FileText, label: 'Docs' },
    { to: `snippets`, icon: Code, label: 'Snippets' },
    { to: `activity`, icon: Activity, label: 'Activity' },
  ] : [];

  return (
    <div className="flex flex-col h-screen">
      <TopNav
        title={currentWorkspace.name}
        showBack
        backTo="/dashboard"
        rightContent={
          <button
            onClick={() => navigate(`/workspace/${workspaceId}/settings`)}
            className="p-2 hover:bg-surface-card text-muted transition-colors"
          >
            <Settings size={20} />
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Project sidebar */}
        <div className="w-56 bg-canvas border-r border-hairline flex flex-col shrink-0 overflow-y-auto">
          {/* Workspace info */}
          <div className="p-4 border-b border-hairline">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={currentWorkspace.name} size="lg" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-ink truncate">{currentWorkspace.name}</h2>
                <span className={clsx(
                  'text-[11px] font-medium uppercase tracking-wider',
                  currentWorkspace.plan === 'pro' ? 'text-ink' : 'text-muted',
                )}>
                  {currentWorkspace.plan}
                </span>
              </div>
            </div>
            <div className="flex -space-x-2">
              {currentWorkspace.members.slice(0, 5).map(m => (
                <Avatar key={m.user.id} src={m.user.avatar} name={m.user.name} size="sm" className="border-2 border-black" />
              ))}
              {currentWorkspace.members.length > 5 && (
                <div className="w-6 h-6 bg-surface-elevated border-2 border-black flex items-center justify-center text-[10px] font-medium text-muted">
                  +{currentWorkspace.members.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Projects</span>
              <button className="p-1 hover:bg-surface-card text-muted hover:text-body">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {projects.map(project => (
                <NavLink
                  key={project.id}
                  to={`/workspace/${workspaceId}/project/${project.id}/board`}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-white/10 text-ink font-medium' : 'text-muted hover:bg-surface-card',
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Members */}
          <div className="p-3 border-t border-hairline">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Members</span>
              <Users size={14} className="text-muted" />
            </div>
            <div className="space-y-1">
              {currentWorkspace.members.map(m => (
                <div key={m.user.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted">
                  <Avatar src={m.user.avatar} name={m.user.name} size="sm" />
                  <span className="truncate flex-1">{m.user.name}</span>
                  <span className="text-[10px] uppercase font-medium text-muted">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Project tabs */}
          {projectId && (
            <div className="bg-canvas border-b border-hairline px-4 flex gap-1 shrink-0 overflow-x-auto">
              {projectTabs.map(tab => (
                <NavLink
                  key={tab.to}
                  to={`/workspace/${workspaceId}/project/${projectId}/${tab.to}`}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap',
                    'hover:text-ink',
                    isActive
                      ? 'border-white text-ink'
                      : 'border-transparent text-muted',
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </NavLink>
              ))}
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
