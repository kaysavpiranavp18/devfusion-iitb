import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, ArrowRight, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkspaceStore } from '../store';
import { TopNav } from '../components/layout/TopNav';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';

export function WorkspacesPage() {
  const navigate = useNavigate();
  const { workspaces } = useWorkspaceStore();

  return (
    <div className="flex flex-col h-screen">
      <TopNav title="Workspaces" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-ink">Workspaces</h1>
              <p className="text-sm text-muted mt-1">Manage your teams and projects</p>
            </div>
            <Button>
              <Plus size={16} /> New Workspace
            </Button>
          </div>

          <div className="space-y-4">
            {workspaces.map(ws => (
              <Card key={ws.id} hover onClick={() => navigate(`/workspace/${ws.id}/overview`)}>
                <CardContent className="flex items-center gap-5 py-5">
                  <Avatar name={ws.name} size="xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-ink">{ws.name}</h3>
                      <span className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5',
                        ws.plan === 'pro'
                          ? 'bg-white/15 text-ink'
                          : 'bg-surface-elevated text-body',
                      )}>
                        {ws.plan}
                      </span>
                    </div>
                    <p className="text-sm text-muted font-light">{ws.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <FolderKanban size={12} />
                        {ws.projects.length} {ws.projects.length === 1 ? 'project' : 'projects'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {ws.members.length} {ws.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                  <div className="flex -space-x-2 mr-2">
                    {ws.members.slice(0, 4).map(m => (
                      <Avatar key={m.user.id} src={m.user.avatar} name={m.user.name} size="md" className="border-2 border-canvas" />
                    ))}
                  </div>
                  <ArrowRight size={18} className="text-muted" />
                </CardContent>
              </Card>
            ))}
          </div>

          {workspaces.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-surface-elevated flex items-center justify-center mx-auto mb-4">
                <FolderKanban size={40} className="text-muted" />
              </div>
              <h2 className="text-lg font-semibold text-body mb-2">No workspaces yet</h2>
              <p className="text-sm text-muted mb-6">Create your first workspace to get started</p>
              <Button>Create Workspace</Button>
            </div>
          )}

          {/* Upgrade banner */}
          <Card className="mt-8 bg-surface-card border-hairline">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ink flex items-center justify-center">
                  <Crown size={24} className="text-canvas" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Upgrade to Pro</h3>
                  <p className="text-xs text-muted">Unlimited workspaces, projects, and AI features.</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate('/payments')}>
                View Plans <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
