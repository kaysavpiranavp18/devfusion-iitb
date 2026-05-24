import { useState } from 'react';
import { Search, ArrowUpDown, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { Task, Priority, TaskStatus } from '../../types';
import { useTaskStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { Badge, PriorityBadge } from '../ui/Badge';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { getUserById } from '../../data/mock';

interface TaskListViewProps {
  projectId: string;
}

type SortField = 'priority' | 'dueDate' | 'status' | 'title';

export function TaskListView({ projectId }: TaskListViewProps) {
  const { tasks } = useTaskStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortField] = useState<SortField>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const filtered = projectTasks
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'priority') {
        const order = { p0: 0, p1: 1, p2: 2 };
        cmp = order[a.priority] - order[b.priority];
      } else if (sortField === 'dueDate') {
        if (!a.dueDate && !b.dueDate) cmp = 0;
        else if (!a.dueDate) cmp = 1;
        else if (!b.dueDate) cmp = -1;
        else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'status') {
        const order = { todo: 0, in_progress: 1, in_review: 2, done: 3 };
        cmp = order[a.status] - order[b.status];
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortAsc ? cmp : -cmp;
    });

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
  };
  const statusColors: Record<TaskStatus, string> = {
    todo: 'bg-surface-elevated text-muted rounded-md border border-hairline',
    in_progress: 'bg-primary/10 text-primary rounded-md border border-primary/20',
    in_review: 'bg-semantic-warning/10 text-semantic-warning rounded-md border border-semantic-warning/20',
    done: 'bg-semantic-success/10 text-semantic-success rounded-md border border-semantic-success/20',
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-surface-card text-ink placeholder:text-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as Priority | 'all')}
          className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Priority</option>
          <option value="p0">P0</option>
          <option value="p1">P1</option>
          <option value="p2">P2</option>
        </select>
        <button
          onClick={() => { setSortAsc(!sortAsc); }}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink px-3 py-2 border border-hairline hover:bg-surface-elevated rounded-lg transition-all"
        >
          <ArrowUpDown size={14} />
          {sortAsc ? 'Asc' : 'Desc'}
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto flex items-center gap-1.5 text-xs font-bold bg-primary hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg transition-all duration-150 uppercase tracking-wider select-none cursor-pointer border-none shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={14} />
          Create Task
        </button>
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden md:block bg-surface-card border border-hairline rounded-xl overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-hairline bg-surface-elevated/40">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted uppercase tracking-wider">Labels</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border-b border-hairline odd:bg-surface-card even:bg-[#0d0d14]/60 hover:bg-surface-elevated/30 cursor-pointer transition-colors"
                  draggable
                  onDragStart={(e) => {
                    const itemData = JSON.stringify({ type: 'task', id: task.id, title: task.title });
                    e.dataTransfer.setData('application/devcollab-item', itemData);
                    e.dataTransfer.setData('text/plain', `@task:${task.title}`);
                  }}
                >
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-ink hover:text-primary transition-colors">{task.title}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={clsx('text-xs font-medium px-3 py-1 inline-block', statusColors[task.status])}>
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3.5">
                    {task.assigneeId ? (
                      <div className="flex items-center gap-2">
                        <Avatar src={getUserById(task.assigneeId)?.avatar} name={getUserById(task.assigneeId)?.name || 'U'} size="sm" />
                        <span className="text-sm text-body">{getUserById(task.assigneeId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1.5 text-sm text-body">
                        <Calendar size={13} className="text-muted" />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </div>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      {task.labels.slice(0, 2).map(l => (
                        <Badge key={l} variant="primary" size="sm">{l}</Badge>
                      ))}
                      {task.labels.length > 2 && (
                        <Badge size="sm">+{task.labels.length - 2}</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    No tasks found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (visible only on mobile) */}
      <div className="md:hidden space-y-3">
        {filtered.map(task => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className="p-4 bg-surface-card border border-hairline rounded-xl hover:border-white/10 transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-ink hover:text-primary transition-colors line-clamp-2">
                {task.title}
              </span>
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 shrink-0', statusColors[task.status])}>
                {statusLabels[task.status]}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline/50 text-xs">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={task.priority} />
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-muted">
                    <Calendar size={12} />
                    <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {task.assigneeId ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar src={getUserById(task.assigneeId)?.avatar} name={getUserById(task.assigneeId)?.name || 'U'} size="sm" className="w-5 h-5" />
                    <span className="text-muted text-[11px] max-w-[85px] truncate">{getUserById(task.assigneeId)?.name}</span>
                  </div>
                ) : (
                  <span className="text-muted text-[11px]">—</span>
                )}
              </div>
            </div>
            
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {task.labels.map(l => (
                  <Badge key={l} variant="primary" size="sm">{l}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted bg-surface-card border border-hairline rounded-xl">
            No tasks found matching your filters
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          initialStatus="todo"
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
