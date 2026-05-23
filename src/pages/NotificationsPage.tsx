import { NotificationCenter } from '../components/notifications/NotificationCenter';

export function NotificationsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <NotificationCenter compact={false} />
        </div>
      </div>
    </div>
  );
}
