import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Users, Calendar, ArrowRight, Plus, Activity as ActivityIcon,
  Sparkles, LayoutDashboard,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspaceStore, useTaskStore, useAuthStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Modal } from '../components/ui/Modal';
import { activities } from '../data/mock';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '../types';

export function WorkspaceOverviewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const {
    currentWorkspace, setCurrentWorkspace, projects, fetchProjects,
    workspaces, addProject,
  } = useWorkspaceStore();
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('#6366f1');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !workspaceId) return;

    const newProject: Project = {
      id: `p${Date.now()}`,
      workspaceId,
      name: projectName.trim(),
      description: projectDescription.trim(),
      color: projectColor,
      members: user ? [{ user, role: 'owner', joinedAt: new Date().toISOString() }] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(newProject);
    setProjectName('');
    setProjectDescription('');
    setProjectColor('#6366f1');
    setIsCreateOpen(false);
  };

  const projectColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  useEffect(() => {
    if (workspaceId) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        fetchProjects(workspaceId);
      }
    }
    return () => setCurrentWorkspace(null);
  }, [workspaceId, setCurrentWorkspace, fetchProjects, workspaces]);

  if (!workspaceId) return null;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-surface-elevated flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={32} className="text-muted" />
          </div>
          <p className="text-sm text-muted">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => projects.some(p => p.id === t.projectId));
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;

  const recentActivities = activities
    .filter(a => a.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <WorkspaceLayout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          {/* Workspace Header */}
          <div className="bg-surface-elevated border border-hairline p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <Avatar name={currentWorkspace.name} size="xl" className="border-2 border-hairline" />
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-ink">{currentWorkspace.name}</h1>
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                      currentWorkspace.plan === 'pro'
                        ? 'bg-white/20 text-ink'
                        : 'bg-surface-elevated text-body',
                    )}>
                      {currentWorkspace.plan}
                    </span>
                  </div>
                  <p className="text-body text-sm font-light">{currentWorkspace.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-body">
                    <span className="flex items-center gap-1.5">
                      <FolderKanban size={14} />
                      {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} />
                      {currentWorkspace.members.length} {currentWorkspace.members.length === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex -space-x-2 shrink-0 self-center md:self-start">
                {currentWorkspace.members.slice(0, 5).map(m => (
                  <Avatar
                    key={m.user.id}
                    src={m.user.avatar}
                    name={m.user.name}
                    size="md"
                    className="border-2 border-hairline"
                  />
                ))}
                {currentWorkspace.members.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-surface-elevated border border-hairline flex items-center justify-center text-[11px] font-medium text-body">
                    +{currentWorkspace.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-m-blue-light bg-m-blue-light/20' },
              { label: 'Total Tasks', value: totalTasks, icon: LayoutDashboard, color: 'text-semantic-warning bg-semantic-warning/20' },
              { label: 'Completed', value: completedTasks, icon: Calendar, color: 'text-semantic-success bg-semantic-success/20' },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 py-5">
                  <div className={clsx('w-12 h-12 flex items-center justify-center', stat.color)}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink">Projects</h2>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus size={14} /> New Project
              </Button>
            </div>
            {projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-surface-elevated flex items-center justify-center mb-4">
                    <FolderKanban size={32} className="text-muted" />
                  </div>
                  <h3 className="text-base font-semibold text-body mb-1">No projects yet</h3>
                  <p className="text-sm text-muted mb-6 max-w-xs">
                    Create your first project to start collaborating with your team.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(project => (
                  <Card key={project.id} hover onClick={() => navigate(`/workspace/${workspaceId}/project/${project.id}/board`)}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">                          <div className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-ink truncate">{project.name}</h3>
                          <p className="text-xs text-muted truncate">{project.description}</p>
                        </div>
                        <ArrowRight size={16} className="text-body shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-body">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                        </span>
                        <div className="flex -space-x-1.5">
                          {project.members.slice(0, 3).map(m => (
                            <Avatar
                              key={m.user.id}
                              src={m.user.avatar}
                              name={m.user.name}
                              size="xs"
                              className="border border-hairline"
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Bottom grid: Members + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Members */}
            <Card>
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink">Members</h2>
                  <span className="text-xs text-muted">{currentWorkspace.members.length} total</span>
                </div>
                <div className="divide-y divide-hairline">
                  {currentWorkspace.members.map(m => (
                    <div key={m.user.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar src={m.user.avatar} name={m.user.name} size="md" />
                      <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{m.user.name}</p>
                      <p className="text-xs text-muted">{m.user.email}</p>
                      </div>
                      <span className={clsx(
                        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        m.role === 'owner' && 'bg-semantic-success/20 text-semantic-success',
                        m.role === 'admin' && 'bg-white/20 text-ink',
                        m.role === 'member' && 'bg-surface-elevated text-body',
                        m.role === 'viewer' && 'bg-surface-card text-muted',
                      )}>
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-0">
                <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink">Recent Activity</h2>
                  {projects.length > 0 && (
                    <button
                      onClick={() => navigate(`/workspace/${workspaceId}/project/${projects[0].id}/activity`)}
                      className="text-xs text-ink hover:text-body font-medium"
                    >
                      View all
                    </button>
                  )}
                </div>
                {recentActivities.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <ActivityIcon size={24} className="text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {recentActivities.map(a => (
                      <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                        <div className={clsx(
                          'w-2 h-2 mt-1.5 shrink-0',
                          a.type === 'task_moved' && 'bg-m-blue-light',
                          a.type === 'task_created' && 'bg-semantic-success',
                          a.type === 'comment_added' && 'bg-semantic-warning',
                          a.type === 'member_joined' && 'bg-m-blue-dark',
                          a.type === 'doc_updated' && 'bg-m-blue-light',
                          a.type === 'snippet_added' && 'bg-m-red',
                          !['task_moved', 'task_created', 'comment_added', 'member_joined', 'doc_updated', 'snippet_added'].includes(a.type) && 'bg-body',
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-body font-light">{a.message}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Assistant CTA */}
          {projects.length > 0 && (
            <Card hover onClick={() => navigate(`/workspace/${workspaceId}/project/${projects[0].id}/activity`)}>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="w-12 h-12 bg-ink flex items-center justify-center shrink-0">
                  <Sparkles size={24} className="text-canvas" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-ink">AI Project Assistant</h3>
                  <p className="text-xs text-muted font-light">Summarize progress, detect blockers, generate standup reports, and break down features automatically.</p>
                </div>
                <ArrowRight size={16} className="text-muted shrink-0" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Frontend Web App, Mobile API"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe this project and its targets..."
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Project Color Accent
            </label>
            <div className="flex gap-2">
              {projectColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setProjectColor(color)}
                  className={clsx(
                    "w-6 h-6 rounded-full border transition-all cursor-pointer",
                    projectColor === color 
                      ? "border-ink scale-110 shadow-sm" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </WorkspaceLayout>
  );
}
