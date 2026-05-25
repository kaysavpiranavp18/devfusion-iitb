import { useState } from 'react';
import { 
  Activity, 
  ArrowLeftRight, 
  PlusCircle, 
  CheckSquare, 
  MessageSquare, 
  FileEdit, 
  FilePlus, 
  UserPlus, 
  Code, 
  UserCheck, 
  AtSign 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import type { ActivityType as ActivityTypeUnion } from '../../types';
import { useActivityStore, useAuthStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { useEffect } from 'react';

interface ActivityFeedProps {
  workspaceId: string;
  projectId?: string;
  showFilters?: boolean;
}

const activityConfig: Record<ActivityTypeUnion, { icon: any; classes: string }> = {
  task_moved: { icon: ArrowLeftRight, classes: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  task_created: { icon: PlusCircle, classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  task_updated: { icon: CheckSquare, classes: 'bg-violet-500/10 text-violet-400 border border-violet-500/20' },
  comment_added: { icon: MessageSquare, classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  doc_updated: { icon: FileEdit, classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  doc_created: { icon: FilePlus, classes: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' },
  member_joined: { icon: UserPlus, classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  snippet_added: { icon: Code, classes: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  task_assigned: { icon: UserCheck, classes: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  mention: { icon: AtSign, classes: 'bg-pink-500/10 text-pink-400 border border-pink-500/20' },
};

export function ActivityFeed({ workspaceId, projectId, showFilters = true }: ActivityFeedProps) {
  const [typeFilter, setTypeFilter] = useState<ActivityTypeUnion | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const { activities, fetchActivities } = useActivityStore();
  const { profiles } = useAuthStore();

  useEffect(() => {
    if (workspaceId) {
      fetchActivities(workspaceId, projectId);
    }
  }, [workspaceId, projectId, fetchActivities]);

  const wsActivities = activities.filter(a => {
    if (a.workspaceId !== workspaceId) return false;
    if (projectId && a.projectId !== projectId) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (memberFilter !== 'all' && a.userId !== memberFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const uniqueMembers = [...new Set(wsActivities.map(a => a.userId))];

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-muted" />
          <h2 className="text-lg font-bold text-ink uppercase tracking-normal">Activity Feed</h2>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as ActivityTypeUnion | 'all')}
              className="text-xs rounded-lg border border-[#1e1e2e] bg-[#111118] text-ink px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm hover:border-[#2a2a3e]"
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
              className="text-xs rounded-lg border border-[#1e1e2e] bg-[#111118] text-ink px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm hover:border-[#2a2a3e]"
            >
              <option value="all">All Members</option>
              {uniqueMembers.map(mid => (
                <option key={mid} value={mid}>{profiles[mid]?.name || mid}</option>
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
            const user = profiles[activity.userId];
            const isLast = idx === wsActivities.length - 1;
            const config = activityConfig[activity.type] || { icon: Activity, classes: 'bg-surface-elevated text-muted border-hairline' };
            const IconComponent = config.icon;
            
            return (
              <div key={activity.id} className="relative flex gap-4 pb-6">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-hairline/50" />
                )}

                {/* Icon */}
                <div className={clsx(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border shrink-0",
                  config.classes
                )}>
                  <IconComponent size={13} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" className="shrink-0 mt-0.5" />
                      <p className="text-sm text-body leading-relaxed">
                        <span className="font-semibold text-ink">{user?.name || 'Someone'}</span>{' '}
                        {activity.message.replace(user?.name || '', '').trim()}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted sm:shrink-0 self-start sm:self-auto pl-[34px] sm:pl-0" title={format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}>
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
