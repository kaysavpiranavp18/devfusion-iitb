import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FolderKanban, Users, CreditCard, Bell, LogOut,
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationsStore } from '../../store';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspaces', icon: FolderKanban, label: 'Workspaces' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: Users, label: 'Profile' },
  { to: '/payments', icon: CreditCard, label: 'Plans' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen } = useUIStore();
  const { unreadCount } = useNotificationsStore();

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-canvas border-r border-hairline flex flex-col transition-all duration-300 z-40',
      sidebarOpen ? 'w-64' : 'w-16',
    )}>
      {/* Logo */}
      <div className={clsx(
        'flex items-center h-16 px-4 border-b border-hairline shrink-0',
        sidebarOpen ? 'justify-between' : 'justify-center',
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-sm">D</span>
          </div>
          {sidebarOpen && <span className="font-bold text-lg text-ink">DevCollab</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150',
              'hover:bg-surface-card',
              sidebarOpen ? 'justify-start' : 'justify-center',
              isActive
                ? 'bg-white/10 text-ink'
                : 'text-muted',
            )}
          >
            <div className="relative shrink-0">
              <item.icon size={20} />
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-semantic-danger text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={clsx(
        'p-3 border-t border-hairline shrink-0',
        sidebarOpen ? 'block' : 'flex justify-center',
      )}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3 px-2 py-2 hover:bg-surface-card transition-colors cursor-pointer group">
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 hover:bg-surface-elevated text-muted hover:text-body opacity-0 group-hover:opacity-100 transition-all" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="md" />
        )}
      </div>
    </aside>
  );
}
