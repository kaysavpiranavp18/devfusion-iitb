import { useState } from 'react';
import { Search, ArrowUpDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import type { Task, Priority, TaskStatus } from '../../types';
import { useTaskStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { Badge, PriorityBadge } from '../ui/Badge';
import { TaskDetailModal } from './TaskDetailModal';
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
    todo: 'bg-surface-elevated text-muted',
    in_progress: 'bg-white/10 text-ink',
    in_review: 'bg-semantic-warning/10 text-semantic-warning',
    done: 'bg-semantic-success/10 text-semantic-success',
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-surface-card text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
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
          className="text-sm border border-hairline bg-surface-card text-ink px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
        >
          <option value="all">All Priority</option>
          <option value="p0">P0</option>
          <option value="p1">P1</option>
          <option value="p2">P2</option>
        </select>          <button
          onClick={() => { setSortAsc(!sortAsc); }}
          className="flex items-center gap-1 text-sm text-muted hover:text-body px-3 py-2 border border-hairline hover:bg-surface-elevated"
        >
          <ArrowUpDown size={14} />
          {sortAsc ? 'Asc' : 'Desc'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-hairline overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-hairline bg-surface-elevated/50">
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
                className="border-b border-hairline hover:bg-surface-card/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-ink">{task.title}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-0.5', statusColors[task.status])}>
                    {statusLabels[task.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  {task.assigneeId ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar src={getUserById(task.assigneeId)?.avatar} name={getUserById(task.assigneeId)?.name || 'U'} size="sm" />
                      <span className="text-sm text-muted">{getUserById(task.assigneeId)?.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.dueDate ? (
                    <div className="flex items-center gap-1 text-sm text-muted">
                      <Calendar size={12} />
                      {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
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
              <tr>                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                  No tasks found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
