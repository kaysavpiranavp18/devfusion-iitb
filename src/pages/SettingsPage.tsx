import { useState } from 'react';
import { Bell, Shield, Palette, Globe, Mail, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type SettingsTab = 'notifications' | 'security' | 'appearance' | 'account';

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('notifications');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [compactMode, setCompactMode] = useState(false);

  const tabs: { id: SettingsTab; icon: any; label: string }[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'account', icon: Globe, label: 'Account' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-canvas">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar tabs */}
            <div className="w-full md:w-48 shrink-0 flex md:flex-col overflow-x-auto pb-2 md:pb-0 gap-1 md:space-y-1 border-b md:border-b-0 border-hairline">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors text-left shrink-0 rounded-lg',
                    tab === t.id
                      ? 'bg-white/10 text-ink'
                      : 'text-muted hover:bg-surface-card',
                  )}
                >
                  <t.icon size={18} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6">
              {tab === 'notifications' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Notification Preferences</h2>
                    <p className="text-sm text-muted mt-1">Configure how you receive notifications</p>
                  </div>
                  <Card>
                    <CardContent className="space-y-4 py-5">
                      <ToggleItem icon={Mail} title="Email Notifications" description="Receive email notifications for task updates" enabled={emailNotifs} onChange={setEmailNotifs} />
                      <ToggleItem icon={Smartphone} title="Push Notifications" description="Receive push notifications in the browser" enabled={pushNotifs} onChange={setPushNotifs} />
                      <ToggleItem icon={Bell} title="@Mentions" description="Get notified when someone mentions you" enabled={mentionNotifs} onChange={setMentionNotifs} />
                    </CardContent>
                  </Card>
                </>
              )}

              {tab === 'security' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Security Settings</h2>
                    <p className="text-sm text-muted mt-1">Manage your account security</p>
                  </div>
                  <Card>
                    <CardContent className="py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Two-Factor Authentication</h3>
                          <p className="text-xs text-muted">Add an extra layer of security to your account</p>
                        </div>
                        <Button size="sm" variant="outline">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Active Sessions</h3>
                          <p className="text-xs text-muted">Manage your active login sessions</p>
                        </div>
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {tab === 'appearance' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Appearance</h2>
                    <p className="text-sm text-muted mt-1">Customize your experience</p>
                  </div>
                  <Card>
                    <CardContent className="py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Theme</h3>
                          <p className="text-xs text-muted">Choose between light and dark mode</p>
                        </div>
                        <div className="flex gap-1 bg-surface-elevated p-1 rounded-lg border border-hairline">
                          <button
                            onClick={() => setTheme('light')}
                            className={clsx(
                              "px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer",
                              theme === 'light' ? "bg-surface-card text-ink shadow-sm" : "text-muted hover:text-ink"
                            )}
                          >
                            Light
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={clsx(
                              "px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer",
                              theme === 'dark' ? "bg-surface-card text-ink shadow-sm" : "text-muted hover:text-ink"
                            )}
                          >
                            Dark
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Compact Mode</h3>
                          <p className="text-xs text-muted">Reduce spacing for a denser layout</p>
                        </div>
                        <button
                          onClick={() => setCompactMode(!compactMode)}
                          className={clsx(
                            'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                            compactMode ? 'bg-ink' : 'bg-hairline',
                          )}
                        >
                          <div className={clsx(
                            'absolute top-0.5 w-5 h-5 bg-canvas rounded-full transition-transform duration-200',
                            compactMode ? 'translate-x-[22px]' : 'translate-x-0.5',
                          )} />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {tab === 'account' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Account Settings</h2>
                    <p className="text-sm text-muted mt-1">Manage your account details</p>
                  </div>
                  <Card>
                    <CardContent className="py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Email Address</h3>
                          <p className="text-xs text-muted">alex@devcollab.io</p>
                        </div>
                        <Button size="sm" variant="outline">Change</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">Password</h3>
                          <p className="text-xs text-muted">Last changed 3 months ago</p>
                        </div>
                        <Button size="sm" variant="outline">Change</Button>
                      </div>
                      <hr className="border-hairline" />
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-rose-400">Danger Zone</h3>
                          <p className="text-xs text-muted">Permanently delete your account</p>
                        </div>
                        <Button size="sm" variant="danger">Delete Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({ icon: Icon, title, description, enabled, onChange }: {
  icon: any; title: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">          <div className="w-8 h-8 bg-surface-elevated flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={16} className="text-muted" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer',
          enabled ? 'bg-ink' : 'bg-hairline',
        )}
      >
        <div className={clsx(
          'absolute top-0.5 w-5 h-5 bg-canvas rounded-full transition-transform duration-200',
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  );
}
