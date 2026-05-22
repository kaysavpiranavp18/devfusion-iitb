import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, Mail, AtSign, GitPullRequest, UserPlus, Info, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationsStore } from '../../store';

const iconMap = {
  mention: AtSign,
  assignment: UserPlus,
  task_update: GitPullRequest,
  invite: Mail,
  system: Info,
};

const colorMap = {
  mention: 'text-m-blue-light bg-m-blue-light/20',
  assignment: 'text-semantic-success bg-semantic-success/20',
  task_update: 'text-semantic-warning bg-semantic-warning/20',
  invite: 'text-body bg-surface-elevated',
  system: 'text-muted bg-surface-elevated',
};

export function NotificationCenter({ compact }: { compact?: boolean }) {
  const { notifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const displayNotifs = compact ? notifications.slice(0, 5) : notifications;

  return (
    <div className={clsx(!compact && 'p-6')}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-muted" />
            <h2 className="text-lg font-bold text-ink uppercase tracking-normal">Notifications</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-semantic-danger/20 text-semantic-danger">
                {notifications.filter(n => !n.read).length} unread
              </span>
            )}
          </div>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-ink hover:text-body"
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        </div>
      )}

      <div className={clsx(compact ? 'space-y-1' : 'space-y-2')}>
        {displayNotifs.map(notif => {
          const Icon = iconMap[notif.type];
          return (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={clsx(
                'flex items-start gap-3 p-3 transition-colors cursor-pointer',
                notif.read ? 'hover:bg-surface-card' : 'bg-white/10 hover:bg-white/15',
              )}
            >
              <div className={clsx('w-8 h-8 flex items-center justify-center shrink-0', colorMap[notif.type])}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={clsx('text-sm', notif.read ? 'text-muted' : 'text-ink font-bold')}>
                    {notif.title}
                  </p>
                  {!notif.read && <span className="w-2 h-2 bg-m-blue-light shrink-0" />}
                </div>
                <p className="text-xs text-muted mt-0.5">{notif.message}</p>
                <p className="text-[11px] text-muted mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>
              {notif.link && (
                <ExternalLink size={14} className="text-muted mt-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-muted mb-3" />
          <p className="text-sm text-muted">No notifications yet</p>
        </div>
      )}
    </div>
  );
}
