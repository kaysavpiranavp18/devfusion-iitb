import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { PriorityBadge, Badge } from '../ui/Badge';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { format } from 'date-fns';
import { getUserById } from '../../data/mock';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', color: '#6366f1' },
  { id: 'in_review', title: 'In Review', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#10b981' },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { tasks, updateTaskStatus } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumn, setCreateColumn] = useState<TaskStatus>('todo');
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    setLocalTasks(tasks.filter(t => t.projectId === projectId));
  }, [tasks, projectId]);

  const getColumnTasks = (status: TaskStatus) =>
    localTasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const newStatus = destination.droppableId as TaskStatus;

    if (source.droppableId !== destination.droppableId) {
      updateTaskStatus(draggableId, newStatus);
    }

    // Reorder locally
    setLocalTasks(prev => {
      const updated = [...prev];
      const task = updated.find(t => t.id === draggableId);
      if (task) {
        task.status = newStatus;
        task.order = destination.index;
      }
      // Reindex
      const colTasks = updated.filter(t => t.status === newStatus).sort((a, b) => a.order - b.order);
      colTasks.forEach((t, i) => { t.order = i; });
      return updated;
    });
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-6 h-full overflow-x-auto min-h-[calc(100vh-8rem)]">
          {columns.map(col => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[280px] max-w-[340px] flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <h3 className="font-bold text-sm text-ink uppercase tracking-wider">{col.title}</h3>
                    <span className="text-xs text-muted font-medium bg-surface-elevated px-1.5 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setCreateColumn(col.id); setShowCreateModal(true); }}
                      className="p-1 hover:bg-surface-card text-muted hover:text-body transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <button className="p-1 hover:bg-surface-card text-muted hover:text-body transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>

                {/* Droppable column */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={clsx(
                        'flex-1 p-2 space-y-2 transition-colors duration-150 min-h-[200px]',
                        snapshot.isDraggingOver ? 'bg-white/10' : 'bg-surface-card/50',
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={clsx(
                              'bg-surface-card border border-hairline p-4',
                              'hover:bg-surface-elevated transition-all duration-150',
                                snapshot.isDragging && 'shadow-lg rotate-2 scale-105',
                              )}
                              onClick={() => setSelectedTask(task)}
                            >
                              {/* Labels */}
                              {task.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {task.labels.map(label => (
                                    <Badge key={label} variant="primary" size="sm">{label}</Badge>
                                  ))}
                                </div>
                              )}

                              {/* Title */}
                              <h4 className="text-sm font-bold text-ink mb-2 leading-snug">
                                {task.title}
                              </h4>

                              {/* Description preview */}
                              {task.description && (
                                <p className="text-xs text-muted mb-3 line-clamp-2">{task.description}</p>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <PriorityBadge priority={task.priority} />
                                  {task.dueDate && (
                                    <span className={clsx(
                                      'text-[11px] font-medium',
                                      new Date(task.dueDate) < new Date() ? 'text-semantic-danger' : 'text-muted',
                                    )}>
                                      {format(new Date(task.dueDate), 'MMM d')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {task.comments.length > 0 && (
                                    <span className="text-[11px] text-muted">{task.comments.length}</span>
                                  )}
                                  {task.assigneeId && (
                                    <Avatar
                                      src={getUserById(task.assigneeId)?.avatar}
                                      name={getUserById(task.assigneeId)?.name || 'U'}
                                      size="sm"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          initialStatus={createColumn}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}
