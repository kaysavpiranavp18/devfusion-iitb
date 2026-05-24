import { useState, useEffect } from 'react';
import { NavLink, Link, useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, FolderKanban, CreditCard, Bell, Sparkles, Menu, X, Check,
  AtSign, UserPlus, GitPullRequest, Mail, Info, CheckSquare, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore, useNotificationsStore, useUIStore } from '../../store';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspaces', icon: FolderKanban, label: 'Workspaces' },
  { to: '/payments', icon: CreditCard, label: 'Plans' },
];

const iconMap: Record<string, React.ComponentType<any>> = {
  mention: AtSign,
  assignment: UserPlus,
  task_update: GitPullRequest,
  invite: Mail,
  system: Info,
  task: CheckSquare,
  comment: MessageSquare,
};

const colorMap: Record<string, string> = {
  mention: 'text-m-blue-light bg-m-blue-light/20',
  assignment: 'text-semantic-success bg-semantic-success/20',
  task_update: 'text-semantic-warning bg-semantic-warning/20',
  invite: 'text-body bg-surface-elevated',
  system: 'text-muted bg-surface-elevated',
  task: 'text-semantic-success bg-[#10b981]/15',
  comment: 'text-[#818cf8] bg-[#818cf8]/15',
};

const THEME_ACCENTS = [
  { id: 'indigo', name: 'Indigo Accent', primary: '#6366f1', blueDark: '#4f46e5', bg: 'bg-[#6366f1]' },
  { id: 'emerald', name: 'Emerald Accent', primary: '#10b981', blueDark: '#059669', bg: 'bg-[#10b981]' },
  { id: 'amber', name: 'Amber Accent', primary: '#f59e0b', blueDark: '#d97706', bg: 'bg-[#f59e0b]' },
  { id: 'rose', name: 'Rose Accent', primary: '#f43f5e', blueDark: '#e11d48', bg: 'bg-[#f43f5e]' },
  { id: 'cyan', name: 'Cyan Accent', primary: '#06b6d4', blueDark: '#0891b2', bg: 'bg-[#06b6d4]' }
];

export function TopNavbar() {
  const { user, logout } = useAuthStore();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const { workspaceId } = useParams();
  const { aiSidebarOpen, toggleAiSidebar } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Dropdown & Themes Modal states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [activeAccent, setActiveAccent] = useState('indigo');

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
    setNotifDropdownOpen(false);
  };

  const toggleNotifDropdown = () => {
    setNotifDropdownOpen(!notifDropdownOpen);
    setUserDropdownOpen(false);
  };

  useEffect(() => {
    const savedAccent = localStorage.getItem('themeAccent');
    if (savedAccent) {
      setActiveAccent(savedAccent);
      const accent = THEME_ACCENTS.find(a => a.id === savedAccent);
      if (accent) {
        document.documentElement.style.setProperty('--color-primary', accent.primary);
        document.documentElement.style.setProperty('--color-m-blue-light', accent.primary);
        document.documentElement.style.setProperty('--color-m-blue-dark', accent.blueDark);
        document.documentElement.style.setProperty('--color-electric-blue', accent.primary);
      }
    }
  }, []);

  const changeAccent = (accentId: string) => {
    const accent = THEME_ACCENTS.find(a => a.id === accentId);
    if (accent) {
      setActiveAccent(accentId);
      document.documentElement.style.setProperty('--color-primary', accent.primary);
      document.documentElement.style.setProperty('--color-m-blue-light', accent.primary);
      document.documentElement.style.setProperty('--color-m-blue-dark', accent.blueDark);
      document.documentElement.style.setProperty('--color-electric-blue', accent.primary);
      localStorage.setItem('themeAccent', accentId);
    }
  };

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

        {/* Notifications Dropdown */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={toggleNotifDropdown}
            className={clsx(
              'relative p-1.5 rounded transition-colors cursor-pointer border-none bg-transparent',
              notifDropdownOpen ? 'text-ink bg-white/10' : 'text-muted hover:text-ink hover:bg-white/[0.04]'
            )}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-semantic-danger text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setNotifDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0d1117] border border-[#1e1e2e] rounded-xl shadow-2xl z-50 py-2 select-none animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-2 border-b border-[#1e1e2e]/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-semantic-danger/20 text-semantic-danger rounded">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      markAllAsRead();
                    }}
                    className="text-[10px] font-semibold text-m-blue-light hover:text-ink transition-colors cursor-pointer border-none bg-transparent flex items-center gap-0.5"
                  >
                    <Check size={10} /> Mark all as read
                  </button>
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-[#1e1e2e]/30">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 px-4">
                      <Bell size={24} className="mx-auto text-muted/40 mb-1.5" />
                      <p className="text-[10px] text-muted">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const Icon = iconMap[notif.type] || Info;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            setNotifDropdownOpen(false);
                            if (notif.link) {
                              navigate(notif.link);
                            }
                          }}
                          className={clsx(
                            'flex items-start gap-2.5 p-3 hover:bg-white/5 transition-colors cursor-pointer',
                            notif.read ? 'opacity-60' : 'bg-white/[0.02]'
                          )}
                        >
                          <div className={clsx('w-6 h-6 flex items-center justify-center shrink-0 rounded', colorMap[notif.type] || 'text-muted bg-surface-elevated')}>
                            <Icon size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className={clsx('text-[11px] truncate', notif.read ? 'text-muted' : 'text-ink font-bold')}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-1.5 h-1.5 bg-m-blue-light rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <p className="text-[9px] text-muted/60 mt-1">
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-hairline" />

        {/* User Profile Dropdown Menu */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={toggleUserDropdown}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent"
          >
            <Avatar src={user?.avatar} name={user?.name || 'User'} size="sm" className="w-6 h-6" />
            <span className="hidden sm:block text-[11px] font-medium text-ink max-w-[80px] truncate">
              {user?.name}
            </span>
          </button>

          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setUserDropdownOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-32 bg-[#0d1117] border border-[#1e1e2e] rounded-xl shadow-2xl z-50 divide-y divide-[#1e1e2e]/50 py-1 select-none animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile');
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsThemesOpen(true);
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted hover:text-ink hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Themes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-muted hover:text-semantic-danger hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Logout
                </button>
              </div>
            </>
          )}
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
      {/* Themes Dialog Modal */}
      <Modal
        open={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
        title="Select Theme Accent"
        size="sm"
      >
        <div className="space-y-4 text-left select-none">
          <p className="text-[11px] text-muted leading-relaxed font-light">Select a primary color accent theme to customize your workspace branding globally.</p>
          
          <div className="grid grid-cols-1 gap-2.5">
            {THEME_ACCENTS.map(accent => {
              const isSelected = activeAccent === accent.id;
              return (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => changeAccent(accent.id)}
                  className={clsx(
                    "flex items-center justify-between w-full px-3 py-2.5 bg-[#0a0a0f] border rounded-xl text-xs cursor-pointer hover:bg-white/5 transition-all",
                    isSelected ? "border-[#6366f1] text-[#6366f1]" : "border-[#1e1e2e]/60 text-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={clsx("w-3.5 h-3.5 rounded-full shrink-0 border border-white/5", accent.bg)} />
                    <span className="font-semibold text-[10px] uppercase tracking-wider">{accent.name}</span>
                  </div>
                  {isSelected && <Check size={12} className="text-[#6366f1]" />}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-end pt-3 border-t border-hairline">
            <button
              type="button"
              onClick={() => setIsThemesOpen(false)}
              className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg cursor-pointer border-none transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
