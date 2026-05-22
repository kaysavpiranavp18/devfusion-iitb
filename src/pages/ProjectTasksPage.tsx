import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutList, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { TaskListView } from '../components/tasks/TaskListView';
import { CalendarView } from '../components/tasks/CalendarView';

export function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [view, setView] = useState<'list' | 'calendar'>('list');

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        {/* View toggle */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1 bg-surface-elevated p-1 w-fit">
            <button
              onClick={() => setView('list')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'list' ? 'bg-surface-card text-ink' : 'text-muted hover:text-body',
              )}
            >
              <LayoutList size={16} /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'calendar' ? 'bg-surface-card text-ink' : 'text-muted hover:text-body',
              )}
            >
              <CalendarDays size={16} /> Calendar
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {view === 'list' ? (
            <TaskListView projectId={projectId!} />
          ) : (
            <CalendarView projectId={projectId!} />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
