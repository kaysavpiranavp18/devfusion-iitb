import { useState, useEffect } from 'react';
import { 
  Bell, Shield, Palette, Globe, Mail, Smartphone, 
  Check, Lock, Eye, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';

type SettingsTab = 'notifications' | 'security' | 'appearance' | 'account';

const THEME_ACCENTS = [
  { id: 'indigo', name: 'Indigo Accent', primary: '#6366f1', blueDark: '#4f46e5', bg: 'bg-[#6366f1]' },
  { id: 'emerald', name: 'Emerald Accent', primary: '#10b981', blueDark: '#059669', bg: 'bg-[#10b981]' },
  { id: 'amber', name: 'Amber Accent', primary: '#f59e0b', blueDark: '#d97706', bg: 'bg-[#f59e0b]' },
  { id: 'rose', name: 'Rose Accent', primary: '#f43f5e', blueDark: '#e11d48', bg: 'bg-[#f43f5e]' },
  { id: 'cyan', name: 'Cyan Accent', primary: '#06b6d4', blueDark: '#0891b2', bg: 'bg-[#06b6d4]' }
];

export function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<SettingsTab>('notifications');
  
  // Notification states
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [assigneeNotifs, setAssigneeNotifs] = useState(true);

  // Appearance states
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [compactMode, setCompactMode] = useState(false);
  const [activeAccent, setActiveAccent] = useState('rose');

  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Toast confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load custom theme accent on mount
  useEffect(() => {
    const checkTheme = () => {
      const savedAccent = localStorage.getItem('themeAccent') || 'rose';
      setActiveAccent(savedAccent);
    };
    checkTheme();
    window.addEventListener('theme-changed', checkTheme);
    return () => {
      window.removeEventListener('theme-changed', checkTheme);
    };
  }, []);

  const changeAccent = (accentId: string) => {
    localStorage.setItem('themeAccent', accentId);
    setActiveAccent(accentId);
    window.dispatchEvent(new Event('theme-changed'));
    triggerToast('Color theme accent updated successfully!');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      triggerToast('Error: New passwords do not match');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('Password updated successfully!');
    } catch (err: any) {
      triggerToast(`Error: ${err.message || 'Failed to update password'}`);
    }
  };

  const tabs: { id: SettingsTab; icon: any; label: string }[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'account', icon: Globe, label: 'Account' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070a10] font-sans select-text">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar tabs */}
            <div className="w-full md:w-52 shrink-0 flex md:flex-col overflow-x-auto pb-2 md:pb-0 gap-1 md:space-y-1 border-b md:border-b-0 border-[#1e1e2e]/40 select-none">
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors text-left shrink-0 rounded-xl cursor-pointer border-none',
                    tab === t.id
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-muted hover:bg-[#111118]/50 hover:text-ink',
                  )}
                >
                  <t.icon size={14} className={tab === t.id ? 'text-[#6366f1]' : 'text-muted'} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 space-y-6">
              
              {/* NOTIFICATIONS TAB */}
              {tab === 'notifications' && (
                <>
                  <div className="text-left select-none">
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                      Notification Preferences
                    </h2>
                    <p className="text-xs text-muted mt-1 font-light">Configure notifications alerts across channels</p>
                  </div>
                  
                  <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60">
                    <CardContent className="space-y-4 py-5">
                      <ToggleItem icon={Mail} title="Email Notifications" description="Receive email alerts for task creations and blockers" enabled={emailNotifs} onChange={(v) => { setEmailNotifs(v); triggerToast('Email notifications updated'); }} />
                      <ToggleItem icon={Smartphone} title="Push Notifications" description="Receive direct browser alerts when updates trigger" enabled={pushNotifs} onChange={(v) => { setPushNotifs(v); triggerToast('Push notifications updated'); }} />
                      <ToggleItem icon={Bell} title="@Mentions Autocomplete Alerts" description="Get notified instantly when teammates tag you in comments" enabled={mentionNotifs} onChange={(v) => { setMentionNotifs(v); triggerToast('@Mentions notifications updated'); }} />
                      <ToggleItem icon={Check} title="Task Assignee Alerts" description="Notify when you are assigned or removed from active tasks" enabled={assigneeNotifs} onChange={(v) => { setAssigneeNotifs(v); triggerToast('Task assignee alerts updated'); }} />
                    </CardContent>
                  </Card>
                </>
              )}

              {/* SECURITY TAB */}
              {tab === 'security' && (
                <>
                  <div className="text-left select-none">
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Security Settings</h2>
                    <p className="text-xs text-muted mt-1 font-light">Manage password configuration and authentication options</p>
                  </div>

                  <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left">
                    <CardContent className="py-5 space-y-5">
                      <form onSubmit={handleSaveSecurity} className="space-y-4">
                        <h3 className="text-xs font-bold text-ink uppercase tracking-wider border-b border-[#1e1e2e]/30 pb-2">Change Password</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Current Password</label>
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={currentPassword}
                              onChange={e => setCurrentPassword(e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-ink px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#6366f1]/60 font-mono"
                              placeholder="••••••••"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">New Password</label>
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-ink px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#6366f1]/60 font-mono"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Confirm New Password</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-ink px-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[#6366f1]/60 w-full sm:w-1/2 font-mono"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="flex items-center gap-1.5 text-[10px] text-muted hover:text-ink transition-colors cursor-pointer bg-transparent border-none"
                          >
                            <Eye size={12} />
                            <span>{showPassword ? "Hide Passwords" : "Show Passwords"}</span>
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#6366f1] text-white hover:bg-[#4f46e5] text-xs font-bold rounded-lg cursor-pointer border-none transition-colors"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>

                      <hr className="border-[#1e1e2e]/40" />

                      <div className="flex items-center justify-between pt-1 select-none">
                        <div>
                          <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Lock size={12} className="text-[#6366f1]" /> Two-Factor Authentication (2FA)
                          </h4>
                          <p className="text-[10px] text-muted font-light mt-0.5">Secure your developer workspace using Authenticator app OTPs</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => triggerToast('Mock 2FA flow initialized')} className="text-xs font-bold">
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* APPEARANCE TAB */}
              {tab === 'appearance' && (
                <>
                  <div className="text-left select-none">
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Appearance settings</h2>
                    <p className="text-xs text-muted mt-1 font-light">Style the visual theme elements of your workspace</p>
                  </div>

                  <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left">
                    <CardContent className="py-5 space-y-6">
                      
                      {/* Theme selection */}
                      <div className="flex items-center justify-between select-none">
                        <div>
                          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Base Theme Color</h3>
                          <p className="text-[10px] text-muted mt-0.5 font-light">Choose standard interface styling modes</p>
                        </div>
                        <div className="flex gap-1 bg-[#0a0a0f] p-1 rounded-xl border border-[#1e1e2e]">
                          <button
                            type="button"
                            onClick={() => { setTheme('light'); triggerToast('Light mode selection is simulated'); }}
                            className={clsx(
                              "px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer border-none",
                              theme === 'light' ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-ink"
                            )}
                          >
                            Light
                          </button>
                          <button
                            type="button"
                            onClick={() => { setTheme('dark'); }}
                            className={clsx(
                              "px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer border-none",
                              theme === 'dark' ? "bg-white/10 text-white shadow-sm" : "text-muted hover:text-ink"
                            )}
                          >
                            Dark (Recomm.)
                          </button>
                        </div>
                      </div>

                      <hr className="border-[#1e1e2e]/30" />

                      {/* Dynamic Color Theme Accent */}
                      <div className="space-y-2 select-none">
                        <div>
                          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Primary Color Accent</h3>
                          <p className="text-[10px] text-muted mt-0.5 font-light">Applies a theme gradient to active elements and tags globally</p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 pt-1.5">
                          {THEME_ACCENTS.map(accent => {
                            const isSelected = activeAccent === accent.id;
                            return (
                              <button
                                key={accent.id}
                                type="button"
                                onClick={() => changeAccent(accent.id)}
                                className={clsx(
                                  "flex items-center gap-2 px-3 py-2 bg-[#0a0a0f] border rounded-xl text-xs cursor-pointer hover:bg-white/5 transition-all",
                                  isSelected ? "border-[#6366f1] text-[#6366f1]" : "border-[#1e1e2e]/60 text-muted"
                                )}
                              >
                                <div className={clsx("w-3 h-3 rounded-full shrink-0 border border-white/5", accent.bg)} />
                                <span className="font-semibold text-[10px] uppercase tracking-wider">{accent.name}</span>
                                {isSelected && <Check size={11} className="text-[#6366f1]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <hr className="border-[#1e1e2e]/30" />

                      {/* Compact mode toggle */}
                      <div className="flex items-center justify-between select-none">
                        <div>
                          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Interface Density</h3>
                          <p className="text-[10px] text-muted mt-0.5 font-light">Reduce padding to dense view lists (Kanban, Snippets)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCompactMode(!compactMode); triggerToast(`Compact layout ${!compactMode ? 'enabled' : 'disabled'}`); }}
                          className={clsx(
                            'relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer border-none',
                            compactMode ? 'bg-[#6366f1]' : 'bg-[#1e1e2e]',
                          )}
                        >
                          <div className={clsx(
                            'absolute top-0.5 w-4.5 h-4.5 bg-canvas rounded-full transition-transform duration-200',
                            compactMode ? 'translate-x-[18px]' : 'translate-x-0.5',
                          )} />
                        </button>
                      </div>

                    </CardContent>
                  </Card>
                </>
              )}

              {/* ACCOUNT TAB */}
              {tab === 'account' && (
                <>
                  <div className="text-left select-none">
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Account Details</h2>
                    <p className="text-xs text-muted mt-1 font-light">Configure settings for developer authentication logs</p>
                  </div>

                  <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left">
                    <CardContent className="py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Registered Email</h3>
                          <p className="text-xs text-muted mt-1 font-mono">{user?.email || 'Not set'}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => triggerToast('Verification mail triggered')} className="text-xs font-bold">Change</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Password Logs</h3>
                          <p className="text-xs text-muted mt-1 font-light">Manage your password through the Security tab</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setTab('security')} className="text-xs font-bold">Update</Button>
                      </div>
                      
                      <hr className="border-[#1e1e2e]/30" />
                      
                      <div className="flex items-center justify-between select-none">
                        <div>
                          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Workspace Termination</h3>
                          <p className="text-[10px] text-muted mt-0.5 font-light">Delete user credentials and delete all stored snippets</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerToast('Deletion requires admin validation overrides')}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg cursor-pointer border border-rose-500/20 transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Alert toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#13131a] border border-[#1e1e2e] text-ink text-xs px-4 py-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center gap-2 border-l-4 border-l-[#6366f1]">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function ToggleItem({ icon: Icon, title, description, enabled, onChange }: {
  icon: any; title: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between text-left select-none">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={14} className="text-muted" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] text-muted font-light mt-0.5">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer border-none',
          enabled ? 'bg-[#6366f1]' : 'bg-[#1e1e2e]',
        )}
      >
        <div className={clsx(
          'absolute top-0.5 w-4.5 h-4.5 bg-canvas rounded-full transition-transform duration-200',
          enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  );
}
