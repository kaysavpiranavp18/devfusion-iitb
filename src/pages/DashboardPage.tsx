import { useNavigate } from 'react-router-dom';
import {
  Plus, FolderKanban, ArrowRight, Clock, Target,
  AlertCircle, CheckCircle2, Circle,
  Users, GitBranch, MessageSquare,
  Layers, BarChart3, Sparkles, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow, addDays, isSameDay } from 'date-fns';
import { useWorkspaceStore, useAuthStore, useTaskStore, useActivityStore, useNotificationsStore } from '../store';
import { Avatar } from '../components/ui/Avatar';
import { PriorityBadge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import type { Project, Task, Activity, Role } from '../types';

// ─── Sparklines Config ────────────────────────────────────────────────────────
const sparklines: Record<string, { path: string; color: string; gradientId: string }> = {
  "Workspaces": {
    path: "M 0 35 C 10 32, 20 36, 30 24 C 40 12, 50 18, 60 14 C 70 10, 80 4, 90 2 C 95 0, 100 0, 100 0",
    color: "#6366f1",
    gradientId: "spark-workspaces"
  },
  "Total Tasks": {
    path: "M 0 25 C 10 30, 20 12, 30 15 C 40 18, 50 8, 60 10 C 70 12, 80 5, 90 6 C 95 8, 100 2, 100 2",
    color: "#f59e0b",
    gradientId: "spark-tasks"
  },
  "Completion": {
    path: "M 0 38 C 10 36, 20 28, 30 30 C 40 32, 50 20, 60 18 C 70 14, 80 8, 90 4 C 95 0, 100 0, 100 0",
    color: "#22c55e",
    gradientId: "spark-completion"
  },
  "Team Size": {
    path: "M 0 30 C 15 28, 25 15, 40 18 C 55 22, 65 5, 80 6 C 90 8, 95 4, 100 4",
    color: "#3b82f6",
    gradientId: "spark-team"
  }
};

function Sparkline({ label, color, gradientId }: { label: string; color: string; gradientId: string }) {
  const data = sparklines[label] || sparklines["Workspaces"];
  const linePath = data.path;
  const fillPath = `${data.path} L 100 40 L 0 40 Z`;
  return (
    <svg viewBox="0 0 100 40" className="w-24 h-10 overflow-visible opacity-50 group-hover:opacity-80 transition-opacity duration-200 shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Redesigned Stat Card (Clean & Standard) ──────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string;
}) {
  const spark = sparklines[label] || { color: color, gradientId: `spark-${label.toLowerCase().replace(/\s+/g, '-')}` };
  return (
    <div className="bg-surface-card border border-hairline/80 p-5 rounded-2xl group transition-colors duration-200 hover:border-white/10 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}0c`, border: `1px solid ${color}1c` }}
          >
            <Icon size={14} style={{ color }} />
          </div>
        </div>
        
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-ink tracking-tight">{value}</p>
            {sub && (
              <p className="text-[11px] text-muted mt-1.5 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {sub}
              </p>
            )}
          </div>
          
          <div className="pl-2">
            <Sparkline label={label} color={color} gradientId={spark.gradientId} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Ring (Clean & Standard) ─────────────────────────────────────────
function ProgressRing({ pct, size = 46, stroke = 2.5, color }: {
  pct: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-500"
        />
      </svg>
      <span className="text-[9px] font-bold text-ink leading-none">{pct}%</span>
    </div>
  );
}

// ─── Priority Queue (Clean & Standard) ────────────────────────────────────────
function PriorityQueue() {
  const { tasks } = useTaskStore();
  const { user } = useAuthStore();

  const userTasks = tasks.filter(t => t.assigneeId === user?.id);
  const overdue = userTasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date() && !isSameDay(new Date(t.dueDate), new Date()));
  const dueToday = userTasks.filter(t => t.status !== 'done' && t.dueDate && isSameDay(new Date(t.dueDate), new Date()));
  const p0open = userTasks.filter(t => t.priority === 'p0' && t.status !== 'done');
  const stale = tasks.filter(t => t.status === 'in_progress' && t.dueDate && new Date(t.dueDate) < addDays(new Date(), -3));

  const items = [
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, dotClass: 'bg-semantic-danger', textClass: 'text-semantic-danger/90' },
    { label: 'Due Today', value: dueToday.length, icon: Clock, dotClass: 'bg-semantic-warning', textClass: 'text-semantic-warning/90' },
    { label: 'P0 Open', value: p0open.length, icon: Target, dotClass: 'bg-semantic-success', textClass: 'text-semantic-success/90' },
    { label: 'Stale', value: stale.length, icon: Circle, dotClass: 'bg-muted', textClass: 'text-muted' },
  ];

  return (
    <div className="bg-surface-card border border-hairline p-5 rounded-2xl">
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Priority Queue</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.label}
            className="group flex items-center justify-between bg-white/[0.01] hover:bg-white/[0.03] border border-hairline/60 px-4 py-3 rounded-xl transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <span className={clsx("h-2 w-2 rounded-full shrink-0", item.dotClass)} />
              <item.icon size={14} className={item.textClass} />
              <span className="text-xs font-medium text-body group-hover:text-ink transition-colors duration-200">{item.label}</span>
            </div>
            
            <span className={clsx(
              'px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/4 border border-white/5',
              item.value > 0 ? 'text-ink' : 'text-muted',
            )}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Utility to clean double username in activity feed ───────────────────────
function cleanActivityMessage(message: string, userName: string) {
  const first = userName.split(' ')[0];
  if (message.startsWith(userName)) {
    return message.slice(userName.length).trim();
  } else if (message.startsWith(first)) {
    return message.slice(first.length).trim();
  }
  return message;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const navigate = useNavigate();
  const { workspaces, fetchWorkspaces, projects } = useWorkspaceStore();
  const { user, profiles } = useAuthStore();
  const { tasks } = useTaskStore();
  const { activities } = useActivityStore();
  const { fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      await fetchWorkspaces();
      await fetchNotifications();
    };
    loadData();
  }, [user, fetchWorkspaces, fetchNotifications]);

  useEffect(() => {
    const loadDashboardStats = async () => {
      if (workspaces.length === 0) return;

      const wsIds = workspaces.map(w => w.id);
      const projIds = workspaces.flatMap(w => w.projects);

      const { data: dbProjects } = await supabase
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
        .in('workspace_id', wsIds);

      if (dbProjects) {
        const formattedProjects: Project[] = dbProjects.map((p: any) => {
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
        useWorkspaceStore.setState({ projects: formattedProjects });
      }

      const freshProjIds = dbProjects ? dbProjects.map((p: any) => p.id) : projIds;
      if (freshProjIds.length > 0) {
        const { data: dbTasks } = await supabase
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
          .in('project_id', freshProjIds)
          .order('updated_at', { ascending: false })
          .limit(200);

        if (dbTasks) {
          const formattedTasks: Task[] = dbTasks.map((t: any) => ({
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
          useTaskStore.setState({ tasks: formattedTasks });
        }
      }

      const { data: dbActivities } = await supabase
        .from('activity_logs')
        .select('*')
        .in('workspace_id', wsIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbActivities) {
        const formattedActivities: Activity[] = dbActivities.map((a: any) => ({
          id: a.id,
          workspaceId: a.workspace_id,
          projectId: a.project_id || undefined,
          type: a.type,
          message: a.message,
          userId: a.user_id,
          metadata: a.metadata || undefined,
          createdAt: a.created_at
        }));
        useActivityStore.setState({ activities: formattedActivities });
      }
    };
    loadDashboardStats();
  }, [workspaces]);

  const allTasks = tasks;
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalMembers = workspaces.reduce((s, w) => s + w.members.length, 0);
  const totalProjects = workspaces.reduce((s, w) => s + w.projects.length, 0);

  const today = new Date();
  const userTasks = allTasks.filter(t => t.assigneeId === user?.id);
  const todayTasks = userTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today));
  const primaryWorkspace = workspaces[0] || null;
  const firstProject = projects[0] || null;
  const firstProjectWorkspaceId = firstProject
    ? workspaces.find(ws => ws.projects.includes(firstProject.id))?.id || primaryWorkspace?.id || null
    : null;
  const projectCards = workspaces.flatMap(ws =>
    ws.projects.map(pid => ({ workspace: ws, projectId: pid }))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-5 md:p-6 space-y-6">
          
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
            <div>
              <h1 className="text-sm font-bold text-ink uppercase tracking-widest">Dashboard</h1>
              <p className="text-[11px] text-muted mt-1 font-medium">{format(today, 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div>
              <button
                onClick={() => navigate('/workspaces')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer border border-primary/20 shadow-md shadow-primary/10"
              >
                <Plus size={14} />
                New Workspace
              </button>
            </div>
          </div>

          {/* ── Metrics Bar ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FolderKanban}
              label="Workspaces"
              value={workspaces.length}
              sub={`${totalProjects} active projects`}
              color="#6366f1"
            />
            <StatCard
              icon={Layers}
              label="Total Tasks"
              value={totalTasks}
              sub={`${doneTasks} completed`}
              color="#f59e0b"
            />
            <StatCard
              icon={BarChart3}
              label="Completion"
              value={`${completionRate}%`}
              sub={`${inProgress} in progress`}
              color="#22c55e"
            />
            <StatCard
              icon={Users}
              label="Team Size"
              value={totalMembers}
              sub={`Across ${workspaces.length} teams`}
              color="#3b82f6"
            />
          </div>

          {/* ── Middle Row: Projects Grid + Priorities ───────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Projects Grid — 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface-card border border-hairline p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <GitBranch size={15} className="text-muted" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Projects</h3>
                  </div>
                  <button
                    onClick={() => navigate('/workspaces')}
                    className="text-xs text-primary hover:text-primary/80 font-bold transition-colors"
                  >
                    View all
                  </button>
                </div>

                {projectCards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projectCards.map(({ workspace: ws, projectId: pid }) => {
                      const project = projects.find((p: { id: string }) => p.id === pid);
                      if (!project) return null;

                      const projTasks = allTasks.filter(t => t.projectId === pid);
                      const projDone = projTasks.filter(t => t.status === 'done').length;
                      const pct = projTasks.length > 0 ? Math.round(projDone / projTasks.length * 100) : 0;
                      const projAssignees = Array.from(new Set(projTasks.map(t => t.assigneeId).filter(Boolean)))
                        .map(id => profiles[id!])
                        .filter(Boolean);

                      return (
                        <button
                          key={pid}
                          onClick={() => navigate(`/workspace/${ws.id}/project/${pid}/board`)}
                          className={clsx(
                            'group text-left bg-surface-card border border-hairline/80 p-5 rounded-2xl transition-colors duration-200 hover:border-white/10',
                            'relative overflow-hidden cursor-pointer flex flex-col justify-between min-h-[150px]'
                          )}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: project.color }} />

                          <div className="flex items-start justify-between gap-3 relative z-10 pl-1.5">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-ink group-hover:text-primary truncate transition-colors leading-tight">
                                {project.name}
                              </p>
                              <p className="text-[9px] font-bold text-muted tracking-widest mt-1.5 uppercase">
                                {ws.name}
                              </p>
                            </div>
                            <ProgressRing pct={pct} size={36} stroke={2.5} color={project.color} />
                          </div>

                          <div className="mt-5 relative z-10 pl-1.5 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {projAssignees.slice(0, 4).map((member, i) => (
                                  <Avatar
                                    key={member?.id || i}
                                    src={member?.avatar}
                                    name={member?.name || '?'}
                                    size="xs"
                                    className="w-5 h-5 border border-surface-card ring-1 ring-white/5"
                                  />
                                ))}
                                {projAssignees.length > 4 && (
                                  <div className="w-5 h-5 bg-canvas border border-hairline flex items-center justify-center text-[9px] font-bold text-muted rounded-full ring-1 ring-white/5">
                                    +{projAssignees.length - 4}
                                  </div>
                                )}
                              </div>

                              <div className="px-2 py-0.5 bg-white/4 border border-white/5 rounded-full text-[9px] text-muted font-bold tracking-wider flex items-center gap-1.5">
                                <span className="text-semantic-success">{projDone} done</span>
                                <span className="text-muted/40">•</span>
                                <span>{projTasks.length} tasks</span>
                              </div>
                            </div>

                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: project.color }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => navigate('/workspaces')}
                      className={clsx(
                        'group flex flex-col items-center justify-center gap-3 bg-white/[0.01] hover:bg-white/[0.02]',
                        'border border-dashed border-hairline hover:border-primary/20 p-5 rounded-2xl min-h-[150px]',
                        'text-xs font-semibold text-muted hover:text-ink transition-all duration-200 cursor-pointer'
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-white/4 border border-white/5 flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-200">
                        <Plus size={16} className="text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <span className="tracking-widest uppercase text-[9px] font-bold text-muted group-hover:text-ink transition-colors">New project</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.9fr] gap-4">
                    <div className="rounded-2xl border border-dashed border-hairline bg-white/[0.01] p-7 min-h-[220px] flex flex-col justify-between">
                      <div>
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                          <FolderKanban size={18} className="text-primary" />
                        </div>
                        <h4 className="text-lg font-semibold text-ink">No projects yet</h4>
                        <p className="mt-2 text-sm text-muted max-w-md leading-relaxed">
                          Create your first project to track tasks, docs, snippets, and team progress from one place.
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate('/workspaces')}
                          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          Create project
                        </button>
                        <button
                          onClick={() => navigate('/workspaces')}
                          className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-muted hover:text-ink hover:bg-white/[0.03] transition-colors"
                        >
                          Open workspaces
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-hairline bg-surface-card p-5 flex flex-col items-center justify-center text-center min-h-[220px]">
                      <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-hairline flex items-center justify-center mb-4">
                        <Plus size={18} className="text-muted" />
                      </div>
                      <p className="text-sm font-semibold text-ink">Quick start</p>
                      <p className="mt-1 text-xs text-muted max-w-xs leading-relaxed">
                        New projects appear here with progress, assignees, and completion status once you add them.
                      </p>
                      <button
                        onClick={() => navigate('/workspaces')}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-hairline text-xs font-semibold text-ink hover:bg-white/8 transition-colors"
                      >
                        <Plus size={13} />
                        Add project
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Priority Queue + Conditional Today Section */}
            <div className="space-y-6">
              <PriorityQueue />

              {/* Today's Tasks Section (hidden if empty) */}
              {todayTasks.length > 0 && (
                <div className="bg-surface-card border border-hairline p-5 rounded-2xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-4">Due Today</h3>
                  <div className="space-y-2.5">
                    {todayTasks
                      .sort((a, b) => (a.priority < b.priority ? -1 : 1))
                      .slice(0, 5)
                      .map(task => {
                        const assignee = task.assigneeId ? profiles[task.assigneeId] : null;
                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-hairline hover:border-white/10 transition-all duration-200 cursor-pointer"
                            onClick={() => {
                              const taskWorkspaceId = workspaces.find(ws => ws.projects.includes(task.projectId))?.id || primaryWorkspace?.id;
                              if (taskWorkspaceId) {
                                navigate(`/workspace/${taskWorkspaceId}/project/${task.projectId}/board`);
                              }
                            }}
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 size={15} className="text-semantic-success mt-0.5 shrink-0" />
                            ) : task.status === 'in_progress' ? (
                              <Circle size={15} className="text-semantic-warning mt-0.5 shrink-0" />
                            ) : (
                              <Circle size={15} className="text-muted mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                'text-xs font-semibold leading-snug',
                                task.status === 'done' ? 'text-muted line-through' : 'text-body-strong',
                              )}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <PriorityBadge priority={task.priority} />
                                {assignee && (
                                  <span className="flex items-center gap-1.5 text-[10px] text-muted">
                                    <Avatar src={assignee.avatar} name={assignee.name} size="xs" className="w-4 h-4 ring-1 ring-white/5" />
                                    {assignee.name.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Quick AI Assistant Card (Standard UI) */}
              <div
                onClick={() => {
                  if (firstProjectWorkspaceId && firstProject) {
                    navigate(`/workspace/${firstProjectWorkspaceId}/project/${firstProject.id}/board`);
                  } else {
                    navigate('/workspaces');
                  }
                }}
                className={clsx(
                  "group p-5 rounded-2xl cursor-pointer transition-colors duration-200 border text-white relative overflow-hidden",
                  "bg-gradient-to-br from-indigo-950 to-indigo-900 border-indigo-500/20 hover:border-indigo-400/30"
                )}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Sparkles size={15} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">AI Assistant</p>
                      <span className="px-1.5 py-0.2 bg-white/10 rounded-md text-[8px] font-bold tracking-normal uppercase text-white/90 border border-white/5">Core</span>
                    </div>
                    <p className="text-[10px] text-indigo-200/80 mt-1 font-medium leading-relaxed">Streamline code & break down tasks</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-transform group-hover:translate-x-0.5">
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom: Recent Activity Timeline ──────────────────────── */}
          <div className="bg-surface-card border border-hairline p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-muted" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Recent Activity</h3>
              </div>
              <button
                onClick={() => {
                  if (primaryWorkspace) {
                    navigate(`/workspace/${primaryWorkspace.id}/overview`);
                  } else {
                    navigate('/workspaces');
                  }
                }}
                className="text-xs text-primary hover:text-primary/80 font-bold transition-colors"
              >
                View all
              </button>
            </div>

            {primaryWorkspace ? (
              <div className="relative pl-3 space-y-4 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-[2px] before:bg-hairline">
                {activities
                .filter(a => a.workspaceId === primaryWorkspace.id)
                .slice(0, 6)
                .map(act => {
                  const actor = profiles[act.userId];
                  const cleanMessage = cleanActivityMessage(act.message, actor?.name || '');
                  
                  // Activity node configurations (colors & icons)
                  let dotColor = 'bg-muted';
                  let ActivityIcon = Circle;
                  
                  if (act.type === 'task_moved') {
                    dotColor = 'bg-purple-500';
                    ActivityIcon = CheckCircle2;
                  } else if (act.type === 'task_created') {
                    dotColor = 'bg-blue-500';
                    ActivityIcon = Plus;
                  } else if (act.type === 'comment_added') {
                    dotColor = 'bg-amber-500';
                    ActivityIcon = MessageSquare;
                  } else if (act.type === 'doc_updated') {
                    dotColor = 'bg-emerald-500';
                    ActivityIcon = FileText;
                  } else if (act.type === 'member_joined') {
                    dotColor = 'bg-rose-500';
                    ActivityIcon = Users;
                  }

                  return (
                    <div 
                      key={act.id} 
                      className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.01] border border-transparent hover:border-white/5 transition-colors duration-200 group"
                    >
                      {/* Timeline avatar node */}
                      <div className="relative z-10 shrink-0">
                        <Avatar 
                          src={actor?.avatar} 
                          name={actor?.name || '?'} 
                          size="sm" 
                          className="w-9 h-9 ring-2 ring-surface-card/90 shrink-0" 
                        />
                        {/* Micro icon overlay */}
                        <div className={clsx(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-surface-card flex items-center justify-center text-white",
                          dotColor
                        )}>
                          <ActivityIcon size={9} className="stroke-[3]" />
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-body leading-relaxed">
                          <span className="font-bold text-ink group-hover:text-primary transition-colors duration-200">{actor?.name}</span>{' '}
                          <span className="text-body">{cleanMessage}</span>
                        </p>
                        <p className="text-[10px] text-muted mt-1.5 flex items-center gap-1.5">
                          <Clock size={10} className="text-muted/60" />
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-hairline bg-white/[0.01] p-6 text-center">
                <MessageSquare size={18} className="mx-auto text-muted mb-2" />
                <p className="text-sm font-semibold text-ink">No activity yet</p>
                <p className="mt-1 text-xs text-muted">Create a workspace and start collaborating to see updates here.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
