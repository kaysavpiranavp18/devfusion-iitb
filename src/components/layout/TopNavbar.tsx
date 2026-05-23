import { useState } from 'react';
import { NavLink, Link, useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FolderKanban, Users, Settings, CreditCard, Bell, LogOut, Sparkles, Menu, X
} from 'lucide-react';
import { useAuthStore, useNotificationsStore, useUIStore } from '../../store';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspaces', icon: FolderKanban, label: 'Workspaces' },
  { to: '/profile', icon: Users, label: 'Profile' },
  { to: '/payments', icon: CreditCard, label: 'Plans' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function TopNavbar() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const { workspaceId } = useParams();
  const { aiSidebarOpen, toggleAiSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="h-10 bg-canvas border-b border-hairline sticky top-0 z-50 px-4 flex items-center justify-between select-none">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        {/* Hamburger for mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 text-muted hover:text-ink md:hidden rounded transition-colors"
          title="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-5 h-5 bg-white flex items-center justify-center transition-transform group-hover:scale-105 rounded-sm">
            <span className="text-black font-extrabold text-[10px]">D</span>
          </div>
          <span className="font-bold text-xs text-ink tracking-tight group-hover:text-ink/90 transition-colors">
            DevCollab
          </span>
        </Link>

        {/* Global Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                'flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium transition-all duration-150 rounded',
                'hover:text-ink',
                isActive
                  ? 'text-ink bg-white/10'
                  : 'text-muted hover:bg-white/[0.04]',
              )}
            >
              <item.icon size={13} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Right: Actions and Profile */}
      <div className="flex items-center gap-2.5">
        {/* AI Copilot Toggle - Only shown in workspace/project pages */}
        {workspaceId && (
          <button
            onClick={toggleAiSidebar}
            className={clsx(
              "p-1.5 transition-all duration-150 cursor-pointer rounded hover:bg-surface-card",
              aiSidebarOpen ? "text-m-blue-light bg-white/10" : "text-muted hover:text-ink"
            )}
            title="Toggle AI Copilot"
          >
            <Sparkles size={16} />
          </button>
        )}

        {/* Notifications Icon Link */}
        <NavLink
          to="/notifications"
          className={({ isActive }) => clsx(
            'relative p-1.5 rounded transition-colors',
            isActive ? 'text-ink bg-white/10' : 'text-muted hover:text-ink hover:bg-white/[0.04]'
          )}
          title="Notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-semantic-danger text-white text-[8px] font-bold flex items-center justify-center rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-hairline" />

        {/* User Profile and Logout */}
        <div className="flex items-center gap-2">
          <Link to="/profile" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" className="w-6 h-6" />
            <span className="hidden sm:inline text-[11px] font-medium text-ink max-w-[80px] truncate">
              {user?.name}
            </span>
          </Link>
          
          <button
            onClick={logout}
            className="p-1.5 text-muted hover:text-semantic-danger hover:bg-white/[0.04] transition-all rounded"
            title="Logout"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-10 bg-canvas border-b border-hairline p-3 flex flex-col gap-1 z-50 md:hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2.5 px-3 py-2 text-xs font-semibold transition-all duration-150 rounded-md',
                  'hover:text-ink',
                  isActive
                    ? 'text-ink bg-white/10'
                    : 'text-muted hover:bg-white/[0.04]',
                )}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
