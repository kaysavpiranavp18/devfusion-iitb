import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, ArrowRight, Crown, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspaceStore, useAuthStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';

const getWorkspaceColor = (name: string) => {
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

function WorkspaceLogo({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md relative overflow-hidden transition-transform duration-200"
      style={{ 
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
        boxShadow: `0 4px 12px ${color}20`
      }}
    >
      <div className="absolute inset-0 bg-white/[0.04] pointer-events-none" />
      <span className="relative z-10 tracking-wider font-bold">{initials}</span>
    </div>
  );
}

export function WorkspacesPage() {
  const navigate = useNavigate();
  const { workspaces, addWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();

  // Create workspace modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    setError(null);

    const newWorkspace = {
      id: `w-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=6366f1`,
      ownerId: user?.id || 'u1',
      members: user ? [{ user, role: 'owner' as const, joinedAt: new Date().toISOString() }] : [],
      projects: [],
      createdAt: new Date().toISOString(),
      plan
    };

    try {
      await addWorkspace(newWorkspace);
      setToastMessage('Workspace created successfully!');
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setPlan('free');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create workspace. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-hairline">
            <div>
              <h1 className="text-sm font-bold text-ink uppercase tracking-widest">Workspaces</h1>
              <p className="text-[11px] text-muted mt-1 font-medium">Manage your team units and shared project workspaces</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-primary/10"
            >
              <Plus size={14} /> New Workspace
            </button>
          </div>

          {/* List */}
          <div className="space-y-4">
            {workspaces.map(ws => {
              const borderAccentColor = getWorkspaceColor(ws.name);
              return (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/workspace/${ws.id}/overview`)}
                  className={clsx(
                    "group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 bg-gradient-to-br from-surface-card to-surface-card/85 border border-hairline/80 rounded-2xl cursor-pointer",
                    "transition-colors duration-200 hover:border-white/10 pl-7"
                  )}
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ backgroundColor: borderAccentColor }}
                  />
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <WorkspaceLogo name={ws.name} color={borderAccentColor} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-ink truncate group-hover:text-primary transition-colors leading-snug">{ws.name}</h3>
                        <span className={clsx(
                          'text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border',
                          ws.plan === 'pro'
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-white/5 border-white/10 text-muted',
                        )}>
                          {ws.plan}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed line-clamp-1">{ws.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-hairline/40">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-white/4 border border-white/5 rounded-lg text-[10px] font-bold text-muted flex items-center gap-1.5">
                        <FolderKanban size={11} className="text-primary" />
                        <span>{ws.projects.length} {ws.projects.length === 1 ? 'Project' : 'Projects'}</span>
                      </div>
                      <div className="px-2.5 py-1 bg-white/4 border border-white/5 rounded-lg text-[10px] font-bold text-muted flex items-center gap-1.5">
                        <Users size={11} className="text-blue-400" />
                        <span>{ws.members.length} {ws.members.length === 1 ? 'Member' : 'Members'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-1.5">
                        {ws.members.slice(0, 4).map(m => (
                          <Avatar key={m.user.id} src={m.user.avatar} name={m.user.name} size="xs" className="w-5 h-5 border border-surface-card ring-1 ring-white/5" />
                        ))}
                        {ws.members.length > 4 && (
                          <div className="w-5 h-5 bg-canvas border border-hairline flex items-center justify-center text-[9px] font-bold text-muted rounded-full ring-1 ring-white/5">
                            +{ws.members.length - 4}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={15} className="text-muted/70 group-hover:text-ink transition-colors shrink-0 hidden sm:block" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {workspaces.length === 0 && (
            <div className="text-center py-16 bg-surface-card border border-hairline/80 rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-canvas border border-hairline flex items-center justify-center mx-auto mb-4 rounded-2xl">
                <FolderKanban size={28} className="text-muted" />
              </div>
              <h2 className="text-sm font-bold text-ink mb-1">No workspaces yet</h2>
              <p className="text-xs text-muted mb-4">Create your first workspace to collaborate on code and tasks</p>
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-primary/10"
              >
                Create Workspace
              </button>
            </div>
          )}

          {/* Upgrade banner */}
          <div className="bg-gradient-to-br from-surface-card to-surface-card/80 border border-hairline/80 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-md">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <Crown size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Upgrade to Pro</h3>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">Unlock unlimited workspaces, larger teams, and fully-featured AI Copilot workflows.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/payments')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-ink text-xs font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              View Plans <ArrowRight size={13} className="text-muted group-hover:text-ink transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* Creation Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Workspace"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-left select-text">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Corporation, Frontend Team"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe this workspace and its purpose..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-ink text-xs focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Workspace Plan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('free')}
                className={clsx(
                  "p-3 rounded-xl border text-left cursor-pointer transition-all duration-200",
                  plan === 'free'
                    ? "bg-primary/5 border-primary text-ink"
                    : "bg-canvas border-hairline text-muted hover:border-white/10"
                )}
              >
                <p className="text-xs font-bold">Free Plan</p>
                <p className="text-[10px] text-muted mt-1 leading-normal">Up to 3 projects and 5 team members.</p>
              </button>

              <button
                type="button"
                onClick={() => setPlan('pro')}
                className={clsx(
                  "p-3 rounded-xl border text-left cursor-pointer transition-all duration-200",
                  plan === 'pro'
                    ? "bg-primary/5 border-primary text-ink"
                    : "bg-canvas border-hairline text-muted hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold">Pro Plan</p>
                  <Crown size={12} className="text-primary" />
                </div>
                <p className="text-[10px] text-muted mt-1 leading-normal">Unlimited projects, team members, and AI.</p>
              </button>
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
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#13131a] border border-[#1e1e2e]/80 text-[#c9d1d9] text-xs px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 border-l-4 border-l-primary select-text rounded-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
          <span className="font-semibold text-white">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#64748b] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 flex items-center justify-center shrink-0"
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
