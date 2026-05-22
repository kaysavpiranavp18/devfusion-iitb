import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTaskStore, useAuthStore } from '../../store';
import type { TaskStatus, Priority } from '../../types';

interface CreateTaskModalProps {
  projectId: string;
  initialStatus: TaskStatus;
  onClose: () => void;
}

export function CreateTaskModal({ projectId, initialStatus, onClose }: CreateTaskModalProps) {
  const { addTask } = useTaskStore();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('p1');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);

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
      status: initialStatus,
      priority,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter task title"
          autoFocus
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the task..."
            rows={3}
            className="block w-full border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Priority</label>
          <div className="flex gap-2">
            {(['p0', 'p1', 'p2'] as Priority[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  priority === p
                    ? 'border-white bg-white/10 text-ink'
                    : 'border-hairline text-muted hover:bg-surface-elevated'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Labels</label>
          <div className="flex gap-2">
            <input
              value={labelInput}
              onChange={e => setLabelInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              placeholder="Type and press Enter"
              className="flex-1 border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            />
            <Button type="button" variant="outline" size="sm" onClick={addLabel}>Add</Button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {labels.map(label => (
                <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 text-ink text-xs font-medium">
                  {label}
                  <button type="button" onClick={() => setLabels(labels.filter(l => l !== label))} className="hover:text-red-500">&times;</button>
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
