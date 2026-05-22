import { useState } from 'react';
import { Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ActivityType as ActivityTypeUnion } from '../../types';
import { activities, getUserById } from '../../data/mock';
import { Avatar } from '../ui/Avatar';

interface ActivityFeedProps {
  workspaceId: string;
  projectId?: string;
  showFilters?: boolean;
}

const activityIcons: Record<ActivityTypeUnion, string> = {
  task_moved: '🔄',
  task_created: '✅',
  task_updated: '✏️',
  comment_added: '💬',
  doc_updated: '📝',
  doc_created: '📄',
  member_joined: '👋',
  snippet_added: '📦',
  task_assigned: '👤',
  mention: '@',
};

export function ActivityFeed({ workspaceId, projectId, showFilters = true }: ActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<ActivityTypeUnion | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  const wsActivities = activities.filter(a => {
    if (a.workspaceId !== workspaceId) return false;
    if (projectId && a.projectId !== projectId) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (memberFilter !== 'all' && a.userId !== memberFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const uniqueMembers = [...new Set(wsActivities.map(a => a.userId))];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-muted" />
          <h2 className="text-lg font-bold text-ink uppercase tracking-normal">Activity Feed</h2>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as ActivityTypeUnion | 'all')}
              className="text-xs rounded-none border border-hairline bg-surface-card text-ink px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            >
              <option value="all">All Types</option>
              <option value="task_moved">Task Moves</option>
              <option value="task_created">Task Created</option>
              <option value="comment_added">Comments</option>
              <option value="doc_updated">Doc Updates</option>
              <option value="member_joined">Members</option>
              <option value="snippet_added">Snippets</option>
            </select>
            <select
              value={memberFilter}
              onChange={e => setMemberFilter(e.target.value)}
              className="text-xs rounded-none border border-hairline bg-surface-card text-ink px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
            >
              <option value="all">All Members</option>
              {uniqueMembers.map(mid => (
                <option key={mid} value={mid}>{getUserById(mid)?.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {wsActivities.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No activity yet. Start collaborating!
          </div>
        )}
        <div className="space-y-0">
          {wsActivities.slice(0, 50).map((activity, idx) => {
            const user = getUserById(activity.userId);
            const isLast = idx === wsActivities.length - 1;
            return (
              <div key={activity.id} className="relative flex gap-4 pb-6">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-hairline/50" />
                )}

                {/* Icon */}                  <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated border border-hairline shrink-0">
                  <span className="text-sm">{activityIcons[activity.type] || '📌'}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" />
                      <p className="text-sm text-body">
                        <span className="font-medium text-ink">{user?.name}</span>{' '}
                        {activity.message.replace(user?.name || '', '').trim()}
                      </p>
                    </div>
                    <span className="text-xs text-muted shrink-0" title={format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}>
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
