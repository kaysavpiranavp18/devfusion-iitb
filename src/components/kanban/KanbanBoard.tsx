import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Calendar, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore, useAuthStore, useNotificationsStore, useWorkspaceStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { CreateTaskModal } from '../tasks/CreateTaskModal';
import { format } from 'date-fns';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const dotColors: Record<TaskStatus, string> = {
  todo: '#475569',
  in_progress: '#818cf8',
  in_review: '#fb923c',
  done: '#4ade80',
};

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

function TaskCard({ task, index, onClick }: TaskCardProps) {
  const [isTitleTwoLines, setIsTitleTwoLines] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const profiles = useAuthStore(state => state.profiles);

  useEffect(() => {
    if (titleRef.current) {
      setIsTitleTwoLines(titleRef.current.offsetHeight > 22);
    }
  }, [task.title]);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={clsx(
            'bg-[#13131a] border border-[rgba(255,255,255,0.07)] rounded-[8px] py-[10px] px-[12px] mb-[6px] text-left cursor-pointer transition-all duration-[120ms] ease-in-out',
            'hover:bg-[#16161f] hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
            snapshot.isDragging && 'shadow-2xl rotate-[1deg] border-[rgba(255,255,255,0.15)] bg-[#16161f] opacity-95',
          )}
          onClick={onClick}
          onDragStart={(e) => {
            const itemData = JSON.stringify({ type: 'task', id: task.id, title: task.title });
            e.dataTransfer.setData('application/devcollab-item', itemData);
            e.dataTransfer.setData('text/plain', `@task:${task.title}`);
          }}
        >
          {/* Row 1 — tags */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.slice(0, 2).map(label => (
                <span
                  key={label}
                  className="text-[10px] text-muted bg-transparent border border-hairline rounded px-1.5 py-0.5 uppercase font-medium tracking-normal"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Row 2 — title */}
          <h4
            ref={titleRef}
            className="text-sm font-medium text-[#cbd5e1] line-clamp-2 mb-1 leading-snug"
          >
            {task.title}
          </h4>

          {/* Row 3 — description */}
          {task.description && !isTitleTwoLines && (
            <p className="text-[11px] text-muted mb-3 truncate leading-normal">
              {task.description}
            </p>
          )}

          {/* Row 4 — footer */}
          <div className="flex items-center justify-between mt-2">
            {/* Left */}
            <div className="flex items-center gap-1.5">
              <div
                className={clsx(
                  "w-[4px] h-[4px] rounded-[1px] shrink-0",
                  task.priority === 'p0' ? 'bg-[#ef4444]' :
                  task.priority === 'p1' ? 'bg-[#f97316]' :
                  task.priority === 'p2' ? 'bg-[#eab308]' : 'bg-[#475569]'
                )}
              />
              {task.dueDate && (
                <span className="text-[11px] text-muted flex items-center gap-1">
                  <Calendar size={11} className="shrink-0 text-muted" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              {task.comments.length > 0 && (
                <span className="text-[11px] text-muted flex items-center gap-0.5">
                  <MessageSquare size={11} className="shrink-0 text-muted" />
                  {task.comments.length}
                </span>
              )}
              {task.assigneeId && (
                <Avatar
                  src={profiles[task.assigneeId]?.avatar}
                  name={profiles[task.assigneeId]?.name || 'U'}
                  size="xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { tasks, updateTaskStatus, fetchTasks } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumn, setCreateColumn] = useState<TaskStatus>('todo');
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  // Presence states
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const [showPresence, setShowPresence] = useState(false);
  const [presenceText, setPresenceText] = useState('');
  const [presentUsers, setPresentUsers] = useState<any[]>([]);

  useEffect(() => {
    const otherMembers = currentWorkspace?.members
      .filter(m => m.user.id !== useAuthStore.getState().user?.id)
      .map(m => m.user) || [];

    if (otherMembers.length === 0) {
      setShowPresence(false);
      return;
    }

    // 3 seconds: show first other member
    const firstMember = otherMembers[0];
    const timeout = setTimeout(() => {
      setPresentUsers([firstMember]);
      setPresenceText(`${firstMember.name} is viewing this board`);
      setShowPresence(true);
    }, 3000);

    let index = 0;
    const interval = setInterval(() => {
      if (otherMembers.length === 0) return;
      const member = otherMembers[index];
      setPresentUsers(prev => {
        if (!prev.some(u => u.id === member.id)) {
          return [...prev, member];
        }
        return prev;
      });
      const actions = ['is viewing this board', 'joined this board', 'is editing a task'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      setPresenceText(`${member.name} ${action}`);
      index = (index + 1) % otherMembers.length;
    }, 8000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [currentWorkspace]);

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

      // Dynamic notification for task moved
      const task = localTasks.find(t => t.id === draggableId);
      const currentUser = useAuthStore.getState().user;
      const currentWorkspace = useWorkspaceStore.getState().currentWorkspace;
      if (task && currentUser) {
        const statusLabels: Record<string, string> = {
          todo: 'To Do',
          in_progress: 'In Progress',
          in_review: 'In Review',
          done: 'Done'
        };
        useNotificationsStore.getState().addNotification({
          id: `n-${Date.now()}`,
          userId: currentUser.id,
          title: 'Task Moved',
          message: `${currentUser.user_metadata?.full_name || currentUser.name || 'Someone'} moved '${task.title}' to ${statusLabels[newStatus] || newStatus}`,
          read: false,
          createdAt: new Date().toISOString(),
          type: 'task',
          link: `/workspace/${currentWorkspace?.id || 'w1'}/project/${task.projectId}/board`
        });
      }
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
      <div className="h-full flex flex-col p-4 bg-canvas">
        {/* Presence Bar */}
        {showPresence && (
          <div className="flex items-center gap-2 px-1 py-2 mb-3 shrink-0 animate-in fade-in duration-300">
            <div className="flex -space-x-1.5">
              {presentUsers.map(u => (
                <div key={u.id} className="relative w-6 h-6 shrink-0">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-6 h-6 rounded-full border border-[#09090b]"
                  />
                  <span className="absolute bottom-0 right-0 w-[8px] h-[8px] bg-emerald-500 rounded-full border-2 border-[#09090b]" />
                </div>
              ))}
            </div>
            <span className="text-xs text-[#71717a] font-normal">
              {presenceText}
            </span>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden bg-canvas select-none min-h-0">
            {columns.map(col => {
              const colTasks = getColumnTasks(col.id);
              return (
                <div
                  key={col.id}
                  className="group flex-1 min-w-[220px] max-w-[340px] h-full flex flex-col bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-[10px] p-3"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-[7px] h-[7px] rounded-full shrink-0"
                        style={{ backgroundColor: dotColors[col.id] }}
                      />
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#64748b]">
                        {col.title}
                      </h3>
                      <span className="bg-hairline text-muted text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => { setCreateColumn(col.id); setShowCreateModal(true); }}
                      className="p-1 hover:bg-white/5 text-muted transition-all cursor-pointer rounded opacity-0 group-hover:opacity-100"
                      title="Add Task"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Droppable column */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={clsx(
                          'flex-1 overflow-y-auto transition-colors duration-150 min-h-[150px]',
                          snapshot.isDraggingOver ? 'bg-white/[0.01]' : 'bg-transparent',
                        )}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onClick={() => setSelectedTask(task)}
                          />
                        ))}
                        {colTasks.length === 0 && (
                          <button
                            onClick={() => { setCreateColumn(col.id); setShowCreateModal(true); }}
                            className="w-full py-4 flex items-center justify-center gap-1.5 text-xs text-muted/60 hover:text-ink transition-colors cursor-pointer bg-transparent border-0 font-normal"
                          >
                            <Plus size={12} />
                            <span>Add a task</span>
                          </button>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

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
