import { useState } from 'react';
import { Calendar, User, MessageSquare, Paperclip, Clock, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { Task, TaskComment } from '../../types';
import { useAuthStore, useTaskStore } from '../../store';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { PriorityBadge } from '../ui/Badge';
import { getUserById } from '../../data/mock';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { user } = useAuthStore();
  const { addComment } = useTaskStore();
  const [comment, setComment] = useState('');

  const handleSubmitComment = () => {
    if (!comment.trim() || !user) return;
    const mentions = comment.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const newComment: TaskComment = {
      id: `c${Date.now()}`,
      taskId: task.id,
      userId: user.id,
      content: comment,
      mentions,
      createdAt: new Date().toISOString(),
    };
    addComment(task.id, newComment);
    setComment('');
  };

  const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;

  return (
    <Modal open onClose={onClose} title={task.title} size="lg">
      <div className="space-y-6">
        {/* Meta row */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <PriorityBadge priority={task.priority} />
          </div>
          {task.labels.map(label => (
            <Badge key={label} variant="primary">{label}</Badge>
          ))}
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Calendar size={14} />
              <span className={clsx(new Date(task.dueDate) < new Date() && 'text-semantic-danger')}>
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Assignee */}
        {assignee && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <User size={14} className="text-muted" />
            <span>Assignee: </span>
            <div className="flex items-center gap-1.5">
              <Avatar src={assignee.avatar} name={assignee.name} size="sm" />
              <span className="font-medium">{assignee.name}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="text-sm font-bold text-ink mb-2">Description</h4>
          <p className="text-sm text-muted leading-relaxed font-light">{task.description}</p>
        </div>

        {/* Attachments */}
        {task.attachments.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-ink mb-2 flex items-center gap-1.5">
              <Paperclip size={14} /> Attachments ({task.attachments.length})
            </h4>
            <div className="flex gap-2">
              {task.attachments.map((att, i) => (
                <div key={i} className="px-3 py-2 bg-surface-elevated border border-hairline text-sm text-muted">
                  {att}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity / Comments */}
        <div>
          <h4 className="text-sm font-bold text-ink mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <MessageSquare size={14} /> Activity ({task.comments.length})
          </h4>

          <div className="space-y-3 mb-4">
            {task.comments.map(c => {
              const commentUser = getUserById(c.userId);
              return (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={commentUser?.avatar} name={commentUser?.name || 'U'} size="md" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-ink">{commentUser?.name}</span>
                      <span className="text-xs text-muted">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    <p className="text-sm text-muted font-light">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comment input */}
          <div className="flex gap-3">
            <Avatar src={user?.avatar} name={user?.name || 'U'} size="md" className="mt-1" />
            <div className="flex-1 relative">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment... Use @ to mention someone"
                className="w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
                className="absolute bottom-2 right-2 p-1.5 bg-ink text-canvas hover:bg-body disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}          <div className="flex items-center gap-4 text-xs text-muted pt-4 border-t border-hairline">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
          </div>
          <div>Updated {format(new Date(task.updatedAt), 'MMM d, h:mm a')}</div>
        </div>
      </div>
    </Modal>
  );
}
