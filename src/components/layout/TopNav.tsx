import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useUIStore, useNotificationsStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store';

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: React.ReactNode;
  showSidebarToggle?: boolean;
}

export function TopNav({ title, showBack, backTo, rightContent, showSidebarToggle }: TopNavProps) {
  const { toggleMobileSidebar, sidebarOpen, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationsStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-canvas border-b border-hairline flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-surface-card text-muted transition-colors cursor-pointer"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 hover:bg-surface-card text-muted"
        >
          <Menu size={20} />
        </button>
        {showBack && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="p-2 hover:bg-surface-card text-muted"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {title && (
          <h1 className="text-base font-semibold text-ink truncate">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightContent}
        <button className="relative p-2 hover:bg-surface-card text-muted transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-semantic-danger text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/profile')} className="ml-1">
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
        </button>
      </div>
    </header>
  );
}
