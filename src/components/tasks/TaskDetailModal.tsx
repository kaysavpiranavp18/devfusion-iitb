import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Paperclip, Send, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskComment } from '../../types';
import { useAuthStore, useTaskStore, useWorkspaceStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { getUserById, users } from '../../data/mock';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { user } = useAuthStore();
  const { addComment, updateTask } = useTaskStore();
  const [comment, setComment] = useState('');

  // Autocomplete Mentions State
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const teamMembers = currentWorkspace?.members.map(m => m.user) || users;
  
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCommentChange = (val: string, selectionStart: number) => {
    setComment(val);
    
    // Find last index of '@' before cursor
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1) {
      // Check if there is any space between the '@' and the cursor
      const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
      if (!textAfterAt.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionIndex(lastAtIdx);
        return;
      }
    }
    
    setShowMentionDropdown(false);
  };

  const selectMention = (name: string) => {
    if (mentionIndex === -1) return;
    
    const beforeAt = comment.slice(0, mentionIndex);
    const afterCursor = comment.slice(textareaRef.current?.selectionStart || (mentionIndex + 1 + mentionQuery.length));
    
    const newText = `${beforeAt}@${name} ${afterCursor}`;
    setComment(newText);
    setShowMentionDropdown(false);
    
    // Restore focus to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeAt.length + name.length + 2; // +1 for @ and +1 for space
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  const filteredMentionUsers = teamMembers.filter(u => 
    u.id !== user?.id &&
    u.name.toLowerCase().includes(mentionQuery)
  );

  // Handle Escape key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmitComment = () => {
    if (!comment.trim() || !user) return;
    const mentions = teamMembers
      .filter(m => comment.includes(`@${m.name}`))
      .map(m => m.id);
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
    setShowMentionDropdown(false);
  };

  // Assignee information is query-loaded dynamically in selection

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] bg-surface-card border-l border-hairline shadow-2xl flex flex-col h-full select-none animate-in">
        
        {/* Top 4px Accent Bar */}
        <div className="h-[4px] w-full bg-primary shrink-0" />

        {/* Header */}
        <div className="p-4 border-b border-hairline flex items-center justify-between shrink-0 bg-canvas/30">
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="text-sm font-bold text-ink bg-transparent border-0 focus:ring-1 focus:ring-primary/40 focus:bg-canvas rounded px-2.5 py-1.5 flex-1 mr-4 focus:outline-none"
            placeholder="Task Title"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-card text-muted hover:text-ink transition-colors cursor-pointer rounded"
            title="Close details (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section: Details (2x2 Grid) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-1">Details</span>
            <div className="grid grid-cols-2 gap-4 bg-canvas/20 p-4 rounded-xl border border-hairline">
              {/* Status Selector */}
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                  className="w-full bg-canvas border border-hairline rounded px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Priority</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                  className="w-full bg-canvas border border-hairline rounded px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="p0">P0 Priority (Critical)</option>
                  <option value="p1">P1 Priority (High)</option>
                  <option value="p2">P2 Priority (Medium)</option>
                  <option value="p3">P3 Priority (Low)</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Assignee</label>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || undefined })}
                  className="w-full bg-canvas border border-hairline rounded px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Due Date</label>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={(e) => updateTask(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full bg-canvas border border-hairline rounded px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Content */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Content</span>

            {/* Labels Editor */}
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1.5">Labels (comma-separated)</label>
              <input
                type="text"
                value={task.labels.join(', ')}
                onChange={(e) => updateTask(task.id, { labels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="e.g. Frontend, Bug, Refactor"
                className="w-full bg-canvas border border-hairline rounded px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted"
              />
            </div>

            {/* Description Editor */}
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={task.description}
                onChange={(e) => updateTask(task.id, { description: e.target.value })}
                placeholder="Add a detailed description for this task..."
                className="w-full bg-canvas border border-hairline rounded p-3 text-xs text-ink min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y placeholder:text-muted"
              />
            </div>
          </div>

          {/* Attachments Section */}
          {task.attachments.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Paperclip size={12} /> Attachments ({task.attachments.length})
              </h4>
              <div className="flex gap-2 flex-wrap">
                {task.attachments.map((att, i) => (
                  <div key={i} className="px-3 py-1.5 bg-canvas border border-hairline text-xs rounded-lg text-muted flex items-center gap-1">
                    <span className="truncate max-w-[120px]">{att}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMENTS / Activity */}
          <div className="pt-4 border-t border-hairline">
            <h4 className="text-[10px] font-bold text-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare size={12} /> COMMENTS ({task.comments.length})
            </h4>

            {/* Comment List */}
            <div className="space-y-4 mb-4">
              {task.comments.map(c => {
                const commentUser = getUserById(c.userId);
                return (
                  <div key={c.id} className="flex gap-3 text-left">
                    <Avatar src={commentUser?.avatar} name={commentUser?.name || 'U'} size="sm" className="w-6 h-6 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-ink">{commentUser?.name}</span>
                        <span className="text-[10px] text-muted">{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-xs text-body leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comment Input styled container */}
            <div className="flex gap-3 items-start bg-canvas/30 p-3.5 border border-hairline rounded-xl relative">
              <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" className="w-7 h-7 shrink-0" />
              <div className="flex-1 space-y-2 relative">
                {showMentionDropdown && (
                  <div className="absolute bottom-full left-0 mb-1.5 w-56 bg-[#0a0a0f] border border-hairline rounded-xl shadow-2xl z-[99] divide-y divide-[#1e1e2e]/50 max-h-48 overflow-y-auto overflow-x-hidden scrollbar-thin">
                    <div className="px-3 py-1 bg-surface-card text-[9px] font-bold uppercase tracking-wider text-muted select-none">Mention Team Member</div>
                    {filteredMentionUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectMention(u.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5 text-[#c9d1d9] hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Avatar src={u.avatar} name={u.name} size="xs" className="w-4 h-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate text-[11px] leading-tight">{u.name}</p>
                          <p className="text-[9px] text-muted truncate leading-none">{u.email}</p>
                        </div>
                      </button>
                    ))}
                    {filteredMentionUsers.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted text-center">No teammates found</div>
                    )}
                  </div>
                )}
                
                <textarea
                  ref={textareaRef}
                  value={comment}
                  onChange={e => handleCommentChange(e.target.value, e.target.selectionStart)}
                  placeholder="Write a comment... Use @ to mention someone"
                  rows={2}
                  className="w-full border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!comment.trim()}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 font-semibold text-xs rounded-lg transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send size={11} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="p-3 border-t border-hairline bg-canvas/30 flex items-center justify-between text-[10px] text-muted shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <span>Updated {format(new Date(task.updatedAt), 'MMM d, h:mm a')}</span>
        </div>

      </div>
    </>
  );
}
