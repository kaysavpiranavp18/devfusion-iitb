import { useState } from 'react';
import { GitPullRequest, Calendar, Edit3, Save, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore, useTaskStore } from '../store';
import { TopNav } from '../components/layout/TopNav';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const { tasks } = useTaskStore();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [github, setGithub] = useState(user?.github || '');
  const [skills, setSkills] = useState(user?.skills || [] as string[]);
  const [skillInput, setSkillInput] = useState('');

  if (!user) return null;

  const completedTasks = tasks.filter(t => t.status === 'done' && t.assigneeId === user.id).length;
  const assignedTasks = tasks.filter(t => t.assigneeId === user.id).length;

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const saveProfile = () => {
    updateProfile({ bio, github, skills });
    setEditing(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <TopNav title="Profile" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Profile header */}
          <Card>
            <CardContent className="relative">
              {/* Cover */}
              <div className="h-32 -mx-5 -mt-5 mb-6 bg-surface-elevated" />
              
              <div className="relative flex flex-col sm:flex-row items-start gap-5">
                <div className="-mt-16 sm:-mt-20">
                  <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-canvas" />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  <div className="flex items-start justify-between">
                    <div>
                  <h1 className="text-2xl font-bold text-ink">{user.name}</h1>
                  <p className="text-sm text-muted">{user.email}</p>
                    </div>
                    {editing ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                          <X size={14} /> Cancel
                        </Button>
                        <Button size="sm" onClick={saveProfile}>
                          <Save size={14} /> Save
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                        <Edit3 size={14} /> Edit Profile
                      </Button>
                    )}
                  </div>

                  {/* Bio */}
                  {editing ? (
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={3}
                      className="w-full mt-3 border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
                      placeholder="Write a short bio..."
                    />
                  ) : (
                    <p className="text-sm text-muted mt-3 leading-relaxed font-light">{user.bio}</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                    {github && (
                      <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-body text-muted">
                        <GitPullRequest size={12} /> GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skills */}
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Skills</h3>
                {editing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Add skill..."
                        className="flex-1 border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
                      />
                      <Button size="sm" variant="outline" onClick={addSkill}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-ink text-xs font-medium">
                          {s}
                          <button onClick={() => setSkills(skills.filter(sk => sk !== s))} className="hover:text-red-400">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map(s => (
                      <Badge key={s} variant="primary">{s}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Assigned Tasks</span>
                    <span className="text-lg font-bold text-ink">{assignedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Completed</span>
                    <span className="text-lg font-bold text-semantic-success">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Completion Rate</span>
                    <span className="text-lg font-bold text-ink">
                      {assignedTasks > 0 ? Math.round(completedTasks / assignedTasks * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected accounts */}
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">Connected Accounts</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-hairline bg-surface-card">
                    <GitPullRequest size={18} className="text-muted" />
                    <span className="text-sm text-muted">GitHub</span>
                    {github ? (
                      <Badge variant="success" size="sm">Connected</Badge>
                    ) : editing ? (
                      <input
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        placeholder="https://github.com/username"
                        className="flex-1 text-sm bg-transparent outline-none text-ink"
                      />
                    ) : (
                      <Badge size="sm">Not connected</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Quick Access */}
          <Card hover onClick={() => {/* navigate to AI */}}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-ink flex items-center justify-center">
                <Sparkles size={20} className="text-canvas" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink">AI Code Reviewer</h3>
                <p className="text-xs text-muted font-light">Get AI-powered reviews on your code snippets</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
