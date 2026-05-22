import { useNavigate } from 'react-router-dom';
import {
  Plus, FolderKanban, ArrowRight, Clock, Target,
  AlertCircle, CheckCircle2, Circle, Activity,
  Users, GitBranch, MessageSquare,
  Layers, BarChart3, Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow, addDays, subDays, isSameDay } from 'date-fns';
import { useWorkspaceStore, useAuthStore, useTaskStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PriorityBadge } from '../components/ui/Badge';
import { TopNav } from '../components/layout/TopNav';
import { getUserById, projects as mockProjects, activities } from '../data/mock';

// ─── Activity heatmap generator ──────────────────────────────────────────────
function generateActivityGrid() {
  const today = new Date();
  const weeks = 12;
  const grid: { date: Date; count: number }[] = [];
  const start = subDays(today, weeks * 7);

  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(start, i);
    const count = Math.floor(Math.abs(Math.sin(i * 2.3) * 4));
    grid.push({ date, count });
  }
  return grid;
}

const activityGrid = generateActivityGrid();

function getHeatColor(count: number) {
  if (count === 0) return 'bg-surface-elevated';
  if (count <= 1) return 'bg-white/15';
  if (count <= 2) return 'bg-white/30';
  if (count <= 3) return 'bg-white/50';
  return 'bg-white/70';
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent?: string;
}) {
  return (
    <div className="bg-surface-card border border-hairline p-4 group hover:bg-surface-elevated transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx(
          'w-9 h-9 flex items-center justify-center',
          accent === 'rose' ? 'bg-rose-500/10 text-rose-400' :
          accent === 'amber' ? 'bg-amber-500/10 text-amber-400' :
          accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
          'bg-white/10 text-ink',
        )}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────
function ActivityHeatmap() {
  const weeks: typeof activityGrid[] = [];
  for (let w = 0; w < 12; w++) {
    weeks.push(activityGrid.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="bg-surface-card border border-hairline p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-muted" />
          <h3 className="text-sm font-medium text-body-strong">Activity</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {['Less', '', '', '', 'More'].map((l, i) => (
            <div key={i} className={clsx('w-3 h-3', getHeatColor(i))} title={l} />
          ))}
        </div>
      </div>
      <div className="flex gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className={clsx('w-3 h-3', getHeatColor(day.count))}
                title={`${format(day.date, 'MMM d')}: ${day.count} actions`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 40, stroke = 3, color }: {
  pct: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
    </svg>
  );
}

// ─── Priority section ─────────────────────────────────────────────────────────
function PrioritySection() {
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();

  const userTasks = tasks.filter(t => t.assigneeId === user?.id);
  const stale = userTasks.filter(t => t.status === 'in_progress' && t.dueDate && new Date(t.dueDate) < new Date());
  const dueSoon = userTasks.filter(t => t.status !== 'done' && t.dueDate && isSameDay(new Date(t.dueDate), new Date()));
  const p0open = userTasks.filter(t => t.priority === 'p0' && t.status !== 'done');
  const blocked = tasks.filter(t => t.status === 'in_progress' && t.dueDate && new Date(t.dueDate) < addDays(new Date(), -3));

  const items = [
    { label: 'Overdue', value: stale.length, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Due Today', value: dueSoon.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'P0 Open', value: p0open.length, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Stale', value: blocked.length, icon: Circle, color: 'text-body', bg: 'bg-white/10' },
  ];

  return (
    <div className="bg-surface-card border border-hairline p-5">
      <h3 className="text-sm font-medium text-body-strong mb-4">Priority Queue</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={clsx('w-7 h-7 flex items-center justify-center', item.bg)}>
                <item.icon size={14} className={item.color} />
              </div>
              <span className="text-sm text-body">{item.label}</span>
            </div>
            <span className={clsx(
              'text-sm font-bold',
              item.value > 0 ? 'text-ink' : 'text-muted',
            )}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const { workspaces } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { tasks } = useTaskStore();

  const allTasks = tasks;
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalMembers = workspaces.reduce((s, w) => s + w.members.length, 0);
  const totalProjects = workspaces.reduce((s, w) => s + w.projects.length, 0);

  const today = new Date();
  const userTasks = allTasks.filter(t => t.assigneeId === user?.id);

  return (
    <div className="flex flex-col h-screen bg-canvas">
      <TopNav
        title={`Dashboard — ${format(today, 'EEEE, MMMM d')}`}
        rightContent={
          <button
            onClick={() => navigate('/workspaces')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-ink text-xs font-medium border border-white/20 hover:border-white/30 transition-all"
          >
            <Plus size={14} />
            New Workspace
          </button>
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-5 md:p-6 space-y-5">

          {/* ── Metrics bar ───────────────────────────────────────────── */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
            <StatCard icon={FolderKanban} label="Workspaces" value={workspaces.length} sub={`${totalProjects} projects`} />
            <StatCard icon={Layers} label="Total Tasks" value={totalTasks} sub={`${doneTasks} completed`} />
            <StatCard icon={BarChart3} label="Completion" value={`${completionRate}%`} sub={`${inProgress} in progress`} accent="amber" />
            <StatCard icon={Users} label="Team" value={totalMembers} sub={`Across ${workspaces.length} teams`} accent="emerald" />
          </div>

          {/* ── Middle row: Activity heatmap + Priority ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Heatmap + projects — 2 cols */}
            <div className="lg:col-span-2 space-y-5">
              <ActivityHeatmap />

              {/* Projects */}
              <div className="bg-surface-card border border-hairline p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitBranch size={15} className="text-muted" />
                    <h3 className="text-sm font-medium text-body-strong">Projects</h3>
                  </div>
                  <button
                    onClick={() => navigate('/workspaces')}
                    className="text-xs text-ink hover:text-body font-medium transition-colors"
                  >
                    View all
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workspaces.flatMap(ws =>
                    ws.projects.map(pid => {
                      const project = mockProjects.find((p: { id: string }) => p.id === pid);
                      if (!project) return null;
                      const projTasks = allTasks.filter(t => t.projectId === pid);
                      const projDone = projTasks.filter(t => t.status === 'done').length;
                      const pct = projTasks.length > 0 ? Math.round(projDone / projTasks.length * 100) : 0;
                      return (
                        <button
                          key={pid}
                          onClick={() => navigate(`/workspace/${ws.id}/project/${pid}/board`)}
                          className="group text-left bg-white/[0.03] hover:bg-white/[0.06] border border-hairline hover:bg-surface-elevated p-4 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                                style={{ backgroundColor: project.color }}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-body group-hover:text-ink truncate transition-colors">
                                  {project.name}
                                </p>
                                <p className="text-[11px] text-muted mt-0.5">{ws.name}</p>
                              </div>
                            </div>
                            <ProgressRing pct={pct} size={32} stroke={2.5} color={project.color} />
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-500/70" />
                              {projDone} done
                            </span>
                            <span>{projTasks.length} total</span>
                            <span className="ml-auto">{pct}%</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                  <button
                    onClick={() => navigate('/workspaces')}
                    className="flex items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-dashed border-hairline hover:border-hairline p-4 text-sm text-muted hover:text-body transition-all"
                  >
                    <Plus size={14} />
                    New project
                  </button>
                </div>
              </div>
            </div>

            {/* Right column: Priority + Today's Tasks */}
            <div className="space-y-5">
              <PrioritySection />

              {/* Today's tasks */}
              <div className="bg-surface-card border border-hairline p-5">
                <h3 className="text-sm font-medium text-body-strong mb-4">Today</h3>
                <div className="space-y-2">
                  {userTasks
                    .filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today))
                    .sort((a, b) => (a.priority < b.priority ? -1 : 1))
                    .slice(0, 5)
                    .map(task => {
                      const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                          onClick={() => navigate('/workspaces')}
                        >
                          {task.status === 'done' ? (
                            <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          ) : task.status === 'in_progress' ? (
                            <Circle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                          ) : (
                            <Circle size={16} className="text-muted mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={clsx(
                              'text-sm leading-snug',
                              task.status === 'done' ? 'text-muted line-through' : 'text-body',
                            )}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <PriorityBadge priority={task.priority} />
                              {assignee && (
                                <span className="flex items-center gap-1 text-[11px] text-muted">
                                  <Avatar src={assignee.avatar} name={assignee.name} size="xs" />
                                  {assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {userTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle2 size={24} className="text-muted mx-auto mb-2" />
                      <p className="text-xs text-muted">No tasks due today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick AI */}
              <div
                onClick={() => navigate('/workspaces')}
                className="group bg-surface-card border border-hairline hover:bg-surface-elevated p-4 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Sparkles size={16} className="text-ink" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-body group-hover:text-ink transition-colors">AI Assistant</p>
                    <p className="text-[11px] text-muted mt-0.5">Summarize, analyze, generate</p>
                  </div>
                  <ArrowRight size={14} className="text-muted group-hover:text-ink ml-auto transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom: Activity feed ─────────────────────────────────── */}
          <div className="bg-surface-card border border-hairline p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-muted" />
                <h3 className="text-sm font-medium text-body-strong">Recent Activity</h3>
              </div>
              <button
                onClick={() => workspaces.length > 0 && navigate(`/workspace/${workspaces[0].id}/activity`)}
                className="text-xs text-ink hover:text-body font-medium transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-1">
              {workspaces.length > 0 && activities
                .filter(a => a.workspaceId === workspaces[0].id)
                .slice(0, 6)
                .map(act => {
                  const actor = getUserById(act.userId);
                  return (
                    <div key={act.id} className="flex items-center gap-3 py-2.5 px-2 hover:bg-white/[0.02] transition-colors">
                      <Avatar src={actor?.avatar} name={actor?.name || '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-body leading-snug">
                          <span className="font-medium text-body">{actor?.name?.split(' ')[0]}</span>{' '}
                          {act.message}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5">
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
