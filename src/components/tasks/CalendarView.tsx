import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { clsx } from 'clsx';
import type { Task } from '../../types';
import { useTaskStore } from '../../store';
import { TaskDetailModal } from './TaskDetailModal';

interface CalendarViewProps {
  projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
  const { tasks } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const projectTasks = tasks.filter(t => t.projectId === projectId && t.dueDate);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const getTasksForDay = (day: Date) =>
    projectTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className="text-muted" />
          <h2 className="text-lg font-bold text-ink">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-1.5 hover:bg-surface-card text-muted"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-xs font-medium text-muted hover:bg-surface-card"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-1.5 hover:bg-surface-card text-muted"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-surface-card border border-hairline overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-hairline">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-3 py-2 text-xs font-bold text-muted uppercase text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for start day */}            {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-hairline bg-surface-card" />
          ))}

          {days.map((day, i) => {
            const dayTasks = getTasksForDay(day);
            return (
              <div
                key={i}
                className={clsx(
                  'min-h-[120px] border-r border-b border-hairline p-2 transition-colors',
                  isToday(day) && 'bg-white/10',
                )}
              >
                <span className={clsx(
                  'inline-flex items-center justify-center w-7 h-7 text-sm rounded-full mb-1',
                  isToday(day) && 'bg-white text-canvas font-bold',
                  !isToday(day) && 'text-muted',
                )}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left px-1.5 py-1 text-[11px] bg-white/10 text-ink hover:bg-white/20 truncate transition-colors"
                    >
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[11px] text-muted px-1">+{dayTasks.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
