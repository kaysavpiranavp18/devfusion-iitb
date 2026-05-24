import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTaskStore, useAuthStore, useWorkspaceStore } from '../../store';
import type { TaskStatus, Priority } from '../../types';
import { clsx } from 'clsx';

interface CreateTaskModalProps {
  projectId: string;
  initialStatus: TaskStatus;
  onClose: () => void;
}

export function CreateTaskModal({ projectId, initialStatus, onClose }: CreateTaskModalProps) {
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Priority>('p1');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);

  const members = currentWorkspace?.members || [];

  const addLabel = () => {
    if (labelInput.trim() && !labels.includes(labelInput.trim())) {
      setLabels(prev => [...prev, labelInput.trim()]);
      setLabelInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    addTask({
      id: `t${Date.now()}`,
      projectId,
      title: title.trim(),
      description,
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      labels,
      attachments: [],
      comments: [],
      order: 0,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Create Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter task title"
          autoFocus
          required
        />
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={3}
            className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted/60 px-3.5 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-[#0c0c14] transition-all duration-150"
          />
        </div>

        {/* Status, Assignee and Due Date grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
              className="block w-full border border-hairline bg-surface-card text-ink px-3.5 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer transition-all duration-150"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Assignee</label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="block w-full border border-hairline bg-surface-card text-ink px-3.5 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer transition-all duration-150"
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="block w-full border border-hairline bg-surface-card text-ink px-3.5 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer transition-all duration-150"
            />
          </div>
        </div>

        {/* Priority buttons */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Priority</label>
          <div className="flex gap-2.5">
            {(['p0', 'p1', 'p2'] as Priority[]).map(p => {
              const label = p === 'p0' ? 'P0 (High)' : p === 'p1' ? 'P1 (Medium)' : 'P2 (Low)';
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={clsx(
                    "flex-1 py-2 px-3 text-xs font-bold rounded-lg border transition-all duration-150 uppercase tracking-wider select-none cursor-pointer",
                    isActive
                      ? p === 'p0'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/5'
                        : p === 'p1'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/5'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                      : 'bg-surface-card border-hairline text-muted hover:text-ink hover:bg-surface-elevated hover:border-white/10'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels Input and Chips */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Labels</label>
          <div className="flex gap-2.5">
            <input
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              placeholder="Type and press Enter"
              className="flex-1 border border-hairline bg-surface-card text-ink placeholder:text-muted/60 px-3.5 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-[#0c0c14] transition-all duration-150"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addLabel}
              className="hover:border-white/20"
            >
              Add
            </Button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {labels.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 text-[#cbd5e1] text-xs font-medium rounded-full select-none"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => setLabels(labels.filter(l => l !== label))}
                    className="text-muted hover:text-rose-400 cursor-pointer font-bold transition-colors text-sm leading-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim()}>Create Task</Button>
        </div>
      </form>
    </Modal>
  );
}
