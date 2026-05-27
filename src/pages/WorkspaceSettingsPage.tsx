import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings, Users, Trash2, UserMinus, AlertTriangle, Loader2, FolderKanban, Check, ArrowLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspaceStore, useAuthStore } from '../store';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Modal } from '../components/ui/Modal';

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentWorkspace, setCurrentWorkspace, workspaces,
    projects, fetchProjects, deleteProject, deleteWorkspace,
    removeWorkspaceMember, updateWorkspace, loading
  } = useWorkspaceStore();

  // Settings form states
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Modals and action states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Member delete
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Project delete
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Workspace delete
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  // Populate workspace details
  useEffect(() => {
    if (workspaceId) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        setWsName(ws.name);
        setWsDescription(ws.description || '');
        fetchProjects(workspaceId);
      }
    }
  }, [workspaceId, workspaces, setCurrentWorkspace, fetchProjects]);

  // Authorization check: only owner/admin
  const currentUserMember = currentWorkspace?.members?.find(m => m.user?.id === user?.id);
  const userRole = currentUserMember?.role;
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const isAllowed = isOwner || isAdmin;

  useEffect(() => {
    if (currentWorkspace && !loading) {
      if (!isAllowed) {
        navigate(`/workspace/${workspaceId}/overview`);
      }
    }
  }, [currentWorkspace, loading, isAllowed, workspaceId, navigate]);

  if (!workspaceId) return null;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  // Handle workspace details update
  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) {
      setDetailsError('Workspace name is required.');
      return;
    }

    setIsUpdatingDetails(true);
    setDetailsError(null);

    try {
      await updateWorkspace(workspaceId, {
        name: wsName.trim(),
        description: wsDescription.trim(),
      });
      setToastMessage('Workspace details updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setDetailsError(err?.message || 'Failed to update workspace details.');
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  // Handle remove member confirmation
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await removeWorkspaceMember(workspaceId, memberToRemove.id);
      setToastMessage(`Removed ${memberToRemove.name} from the workspace.`);
      setIsRemoveMemberOpen(false);
      setMemberToRemove(null);
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to remove member.');
    } finally {
      setIsRemovingMember(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle delete project confirmation
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeletingProject(true);
    try {
      await deleteProject(projectToDelete.id);
      setToastMessage(`Project "${projectToDelete.name}" deleted.`);
      setIsDeleteProjectOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to delete project.');
    } finally {
      setIsDeletingProject(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle delete workspace confirmation
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmationName !== currentWorkspace.name) return;
    setIsDeletingWorkspace(true);
    try {
      await deleteWorkspace(workspaceId);
      setIsDeleteWorkspaceOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to delete workspace.');
      setIsDeletingWorkspace(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="flex-1 overflow-auto bg-[#070a10] select-text">
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-16">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-hairline pb-4 shrink-0 select-none">
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/overview`)}
              className="p-1.5 hover:bg-white/5 text-muted hover:text-ink rounded-lg transition-colors cursor-pointer border-none bg-transparent"
              title="Back to Overview"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-primary" />
              <h1 className="text-xl font-bold text-ink uppercase tracking-wider">Workspace Settings</h1>
            </div>
          </div>

          {/* Section 1: General Details */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4 flex items-center gap-2 select-none">
                <Settings size={16} className="text-muted" />
                General Settings
              </h2>
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                {detailsError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                    {detailsError}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 select-none">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter workspace name"
                    value={wsName}
                    onChange={e => setWsName(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 select-none">
                    Workspace Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a description for this workspace..."
                    value={wsDescription}
                    onChange={e => setWsDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none font-medium"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isUpdatingDetails} size="sm">
                    {isUpdatingDetails ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : 'Save Details'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Member Management */}
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center select-none">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-muted" />
                  Member Management
                </h2>
                <span className="text-xs text-muted font-medium">{currentWorkspace.members.length} member(s)</span>
              </div>
              <div className="divide-y divide-hairline">
                {currentWorkspace.members.map(member => {
                  const isTargetOwner = member.role === 'owner';
                  const isCurrentUser = member.user.id === user?.id;
                  
                  return (
                    <div key={member.user.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.01]">
                      <Avatar src={member.user.avatar} name={member.user.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {member.user.name} {isCurrentUser && <span className="text-muted text-[10px] font-normal font-sans ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-muted truncate">{member.user.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={clsx(
                          'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full select-none',
                          member.role === 'owner' && 'bg-semantic-success/20 text-semantic-success border border-semantic-success/10',
                          member.role === 'admin' && 'bg-white/10 text-ink border border-white/5',
                          member.role === 'member' && 'bg-surface-elevated text-body border border-hairline',
                          member.role === 'viewer' && 'bg-surface-card text-muted'
                        )}>
                          {member.role}
                        </span>

                        {!isTargetOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setMemberToRemove({ id: member.user.id, name: member.user.name });
                              setIsRemoveMemberOpen(true);
                            }}
                            className="p-1.5 border border-hairline text-muted hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer bg-transparent"
                            title="Remove Member"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Project Management */}
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center select-none">
                <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                  <FolderKanban size={16} className="text-muted" />
                  Project Management
                </h2>
                <span className="text-xs text-muted font-medium">{projects.length} project(s)</span>
              </div>
              
              {projects.length === 0 ? (
                <div className="px-6 py-10 text-center select-none">
                  <FolderKanban size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">No projects in this workspace.</p>
                </div>
              ) : (
                <div className="divide-y divide-hairline">
                  {projects.map(project => (
                    <div key={project.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.01]">
                      <div
                        className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-ink truncate">{project.name}</h3>
                        <p className="text-xs text-muted truncate">{project.description || 'No description provided.'}</p>
                      </div>
                      
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setProjectToDelete({ id: project.id, name: project.name });
                            setIsDeleteProjectOpen(true);
                          }}
                          className="p-2 border border-rose-500/20 text-rose-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all rounded-lg cursor-pointer flex items-center gap-1.5 bg-transparent text-[10px] font-bold uppercase tracking-wider"
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Danger Zone */}
          <Card className="border-rose-500/30 bg-rose-500/[0.01]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3 select-none">
                <AlertTriangle className="text-rose-500 mt-0.5 shrink-0 animate-pulse" size={20} />
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Danger Zone</h2>
                  <p className="text-xs text-muted font-light leading-relaxed">
                    Operations in this section are highly sensitive. Deleting a workspace will permanently destroy all its projects, task boards, comments, activity logs, and wiki pages. This action cannot be reversed.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-500/10 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Delete this workspace</h3>
                  <p className="text-[10px] text-muted font-light mt-0.5">
                    {isOwner ? 'Permanently delete this workspace and all its data.' : 'Only the workspace Owner can delete this workspace.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setIsDeleteWorkspaceOpen(true)}
                  className="px-4 py-2 bg-rose-600 disabled:bg-white/5 hover:bg-rose-700 text-white disabled:text-muted/40 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg cursor-pointer disabled:cursor-not-allowed border-none shadow-md shadow-rose-900/10"
                >
                  Delete Workspace
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Remove Member */}
      <Modal
        open={isRemoveMemberOpen}
        onClose={() => { setIsRemoveMemberOpen(false); setMemberToRemove(null); }}
        title="Remove Member"
        size="sm"
      >
        {memberToRemove && (
          <div className="space-y-4 text-left select-text">
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-white">{memberToRemove.name}</span> from the workspace? They will lose access to all projects, wiki docs, code snippets, and boards associated with this workspace.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => { setIsRemoveMemberOpen(false); setMemberToRemove(null); }}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={isRemovingMember}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isRemovingMember ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : <UserMinus size={12} />}
                <span>Remove Member</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Delete Project */}
      <Modal
        open={isDeleteProjectOpen}
        onClose={() => { setIsDeleteProjectOpen(false); setProjectToDelete(null); }}
        title="Delete Project"
        size="sm"
      >
        {projectToDelete && (
          <div className="space-y-4 text-left select-text">
            <p className="text-xs text-muted leading-relaxed">
              Are you sure you want to permanently delete project <span className="font-semibold text-white">"{projectToDelete.name}"</span>? This will destroy all task lists, files, snippets, and activity records for this project.
            </p>
            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-lg flex gap-2 items-start">
              <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-300 font-light">Warning: This action is permanent and cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => { setIsDeleteProjectOpen(false); setProjectToDelete(null); }}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeletingProject}
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60 flex items-center gap-1.5"
              >
                {isDeletingProject ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : <Trash2 size={12} />}
                <span>Delete Project</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Delete Workspace */}
      <Modal
        open={isDeleteWorkspaceOpen}
        onClose={() => { setIsDeleteWorkspaceOpen(false); setDeleteConfirmationName(''); }}
        title="Delete Workspace"
        size="md"
      >
        <div className="space-y-4 text-left select-text">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex gap-2 items-start">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-semibold">Destructive Action Required</p>
              <p className="mt-0.5 font-light">This will permanently purge the workspace, its projects, and all records from the system.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted">
              To confirm deletion, please enter the name of the workspace (<span className="font-semibold text-white">{currentWorkspace.name}</span>) below:
            </p>
            <input
              type="text"
              placeholder="Type workspace name to confirm"
              value={deleteConfirmationName}
              onChange={e => setDeleteConfirmationName(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => { setIsDeleteWorkspaceOpen(false); setDeleteConfirmationName(''); }}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteWorkspace}
              disabled={isDeletingWorkspace || deleteConfirmationName !== currentWorkspace.name}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-950/20 text-white disabled:text-muted/40 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 disabled:cursor-not-allowed"
            >
              {isDeletingWorkspace ? (
                <Loader2 size={12} className="animate-spin" />
              ) : <Trash2 size={12} />}
              <span>Delete Workspace</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#13131a] border border-[#1e1e2e] text-ink text-xs px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 border-l-4 border-l-[#6366f1] select-none">
          <Check size={14} className="text-[#6366f1] shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </WorkspaceLayout>
  );
}
