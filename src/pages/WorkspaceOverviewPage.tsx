import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Users, Calendar, ArrowRight, Plus, Activity as ActivityIcon,
  Sparkles, LayoutDashboard, Lock, UserPlus, UserMinus, Shield, Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspaceStore, useTaskStore, useAuthStore, useActivityStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Modal } from '../components/ui/Modal';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { backendJson } from '../lib/api';

export function WorkspaceOverviewPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const {
    currentWorkspace, setCurrentWorkspace, projects, fetchProjects,
    workspaces, addProject, fetchWorkspaces, deleteProject,
  } = useWorkspaceStore();
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();
  const { activities, fetchActivities } = useActivityStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('#6366f1');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invite states
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member');
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [manageProjectId, setManageProjectId] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectAccessBusy, setProjectAccessBusy] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText('https://devcollab.app/invite/abc123xyz');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !currentWorkspace) return;

    try {
      const response = await backendJson<{ success: boolean; message: string; data: any }>(
        `/workspaces/${currentWorkspace.id}/invite`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        }
      );

      await fetchWorkspaces();

      setIsInviteOpen(false);

      const isPending = response.data?.pending;
      if (isPending) {
        setToastMessage(`Invitation email sent to ${inviteEmail.trim()}.`);
      } else {
        const addedName = response.data?.user?.name || inviteEmail.trim();
        setToastMessage(`Successfully added ${addedName} to the workspace.`);
      }

      setInviteEmail('');
      setInviteRole('member');
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to add workspace member.');
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !workspaceId) return;
    setIsCreating(true);
    setError(null);

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

    try {
      await addProject(newProject);
      setProjectName('');
      setProjectDescription('');
      setProjectColor('#6366f1');
      setIsCreateOpen(false);
      setToastMessage('Project created successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const projectColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  const activeManagedProject = projects.find(project => project.id === manageProjectId) || null;

  const canManageProject = (project: Project) => {
    const currentUserId = user?.id;
    if (!currentUserId) return false;
    return project.members.some(member => member.user.id === currentUserId && (member.role === 'owner' || member.role === 'admin'));
  };

  const isOwner = (project: Project) => {
    const currentUserId = user?.id;
    if (!currentUserId) return false;
    return project.members.some(member => member.user.id === currentUserId && member.role === 'owner');
  };

  const canAccessProject = (project: Project) => {
    const currentUserId = user?.id;
    if (!currentUserId) return false;
    return project.members.some(member => member.user.id === currentUserId);
  };

  const updateProjectAccess = async (memberUserId: string, action: 'add' | 'remove') => {
    if (!workspaceId || !activeManagedProject) return;

    setProjectAccessBusy(memberUserId);
    try {
      try {
        if (action === 'add') {
          await backendJson(`/projects/${activeManagedProject.id}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId: memberUserId, role: 'member' }),
          });
        } else {
          await backendJson(`/projects/${activeManagedProject.id}/members/${memberUserId}`, {
            method: 'DELETE',
          });
        }
      } catch {

        if (action === 'add') {
          const { error } = await supabase
            .from('project_members')
            .insert({
              project_id: activeManagedProject.id,
              user_id: memberUserId,
              role: 'member',
            });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('project_members')
            .delete()
            .eq('project_id', activeManagedProject.id)
            .eq('user_id', memberUserId);

          if (error) throw error;
        }
      }

      setToastMessage(action === 'add' ? 'Project access granted.' : 'Project access removed.');
      await fetchProjects(workspaceId);
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to update project access.');
    } finally {
      setProjectAccessBusy(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const workspaceMembers = currentWorkspace?.members || [];

  const accessibleWorkspaceMembers = workspaceMembers.filter(member => {
    return !activeManagedProject?.members.some(projectMember => projectMember.user.id === member.user.id);
  });

  const filteredAssignableMembers = accessibleWorkspaceMembers.filter(member => {
    const term = projectSearch.trim().toLowerCase();
    if (!term) return true;
    return member.user.name.toLowerCase().includes(term) || member.user.email.toLowerCase().includes(term);
  });

  useEffect(() => {
    if (workspaceId) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        fetchProjects(workspaceId);
        fetchActivities(workspaceId);
      }
    }
    return () => setCurrentWorkspace(null);
  }, [workspaceId, setCurrentWorkspace, fetchProjects, workspaces, fetchActivities]);

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
                  <Card
                    key={project.id}
                    hover={canAccessProject(project)}
                    onClick={() => {
                      if (canAccessProject(project)) {
                        navigate(`/workspace/${workspaceId}/project/${project.id}/board`);
                      }
                    }}
                    className={clsx(!canAccessProject(project) && 'opacity-80')}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-ink truncate">{project.name}</h3>
                          <p className="text-xs text-muted truncate">{project.description}</p>
                        </div>
                        {canAccessProject(project) ? (
                          <ArrowRight size={16} className="text-body shrink-0" />
                        ) : (
                          <Lock size={16} className="text-semantic-warning shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-body">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
                        </span>
                        <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              if (canManageProject(project)) {
                                setManageProjectId(project.id);
                                setProjectSearch('');
                              }
                            }}
                            className={clsx(
                              'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border transition-colors',
                              canManageProject(project)
                                ? 'border-hairline text-muted hover:text-ink hover:bg-white/5'
                                : 'border-hairline/50 text-muted/50 cursor-not-allowed',
                            )}
                            disabled={!canManageProject(project)}
                          >
                            <Shield size={11} />
                            Access
                          </button>
                          {isOwner(project) && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteProjectId(project.id);
                                setIsDeleteOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded border border-rose-500 text-rose-400 hover:bg-rose-500/5"
                            >
                              Delete
                            </button>
                          )}
                          {!canAccessProject(project) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-semantic-warning/10 text-semantic-warning border border-semantic-warning/20">
                              <Lock size={11} /> Locked
                            </span>
                          )}
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{currentWorkspace.members.length} total</span>
                    <Button size="sm" onClick={() => setIsInviteOpen(true)} className="rounded-lg py-1 px-3">
                      Invite Member
                    </Button>
                  </div>
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
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-left select-text">
              {error}
            </div>
          )}
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
              disabled={isCreating}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-primary/10 flex items-center gap-1.5"
            >
              {isCreating ? (
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : null}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite to workspace"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all animate-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Role
            </label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
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
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={!inviteEmail.trim()}
                className="px-3.5 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Project Access Modal */}
      <Modal
        open={Boolean(manageProjectId)}
        onClose={() => setManageProjectId(null)}
        title={activeManagedProject ? `${activeManagedProject.name} access` : 'Project access'}
        size="lg"
      >
        {activeManagedProject && (
          <div className="space-y-6">
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Current access</p>
              <div className="flex flex-wrap gap-2">
                {activeManagedProject.members.map(member => (
                  <span
                    key={member.user.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline bg-white/5 text-xs text-ink"
                  >
                    <Avatar src={member.user.avatar} name={member.user.name} size="xs" />
                    <span>{member.user.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted">{member.role}</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Workspace members</h3>
                  <p className="text-xs text-muted">Grant access to this project without adding them to other projects.</p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    placeholder="Search members"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-canvas text-ink placeholder:text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {filteredAssignableMembers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-hairline bg-canvas text-sm text-muted">
                    No workspace members available to add.
                  </div>
                ) : filteredAssignableMembers.map(member => (
                  <div key={member.user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-hairline bg-canvas">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={member.user.avatar} name={member.user.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{member.user.name}</p>
                        <p className="text-xs text-muted truncate">{member.user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={projectAccessBusy === member.user.id}
                      onClick={() => updateProjectAccess(member.user.id, 'add')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <UserPlus size={13} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Project members</h3>
              <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                {activeManagedProject.members.map(member => (
                  <div key={member.user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-hairline bg-canvas">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={member.user.avatar} name={member.user.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{member.user.name}</p>
                        <p className="text-xs text-muted truncate">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx(
                        'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        member.role === 'owner' && 'bg-semantic-success/20 text-semantic-success',
                        member.role === 'admin' && 'bg-white/20 text-ink',
                        member.role === 'member' && 'bg-surface-elevated text-body',
                        member.role === 'viewer' && 'bg-surface-card text-muted',
                      )}>
                        {member.role}
                      </span>
                      {member.role !== 'owner' && (
                        <button
                          type="button"
                          disabled={projectAccessBusy === member.user.id}
                          onClick={() => updateProjectAccess(member.user.id, 'remove')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-ink hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <UserMinus size={13} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Project Confirm Modal */}
      <Modal
        open={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeleteProjectId(null); }}
        title="Delete project"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Are you sure you want to permanently delete this project? This action cannot be undone.</p>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { setIsDeleteOpen(false); setDeleteProjectId(null); }}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!deleteProjectId) return;
                setIsDeleting(true);
                try {
                  await deleteProject(deleteProjectId);
                  setToastMessage('Project deleted.');
                  setIsDeleteOpen(false);
                  setDeleteProjectId(null);
                } catch (err) {
                  console.error(err);
                  setToastMessage('Failed to delete project.');
                } finally {
                  setIsDeleting(false);
                  setTimeout(() => setToastMessage(null), 3000);
                }
              }}
              disabled={isDeleting}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#13131a] border border-[#1e1e2e] text-ink text-xs px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 border-l-4 border-l-[#6366f1]">
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </WorkspaceLayout>
  );
}
