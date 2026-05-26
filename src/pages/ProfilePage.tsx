import { useState, useEffect } from 'react';
import { 
  GitPullRequest, Calendar, Edit3, Save, X, ListTodo, 
  CheckCircle2, Percent, Sparkles, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [github, setGithub] = useState(user?.github || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [userTasks, setUserTasks] = useState<{status: string; assigneeId: string}[]>([]);

  useEffect(() => {
    const fetchUserTasks = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('tasks')
        .select('status, assignee_id')
        .eq('assignee_id', user.id);
      if (!error && data) {
        setUserTasks(data.map((t: any) => ({ status: t.status, assigneeId: t.assignee_id })));
      }
    };
    fetchUserTasks();
  }, [user?.id]);

  if (!user) return null;

  const completedTasks = userTasks.filter(t => t.status === 'done').length;
  const assignedTasks = userTasks.length;

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
    <div className="flex-grow flex flex-col min-h-0 bg-[#070a10] font-sans select-text">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          
          {/* Profile header */}
          <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60">
            <CardContent className="relative p-6">
              <div className="h-24 -mx-6 -mt-6 mb-6 bg-gradient-to-r from-indigo-900/30 via-indigo-950/15 to-transparent border-b border-[#1e1e2e]/30" />
              
              <div className="relative flex flex-col sm:flex-row items-start gap-5 text-left">
                <div className="-mt-16 sm:-mt-20 z-10 select-none">
                  <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-[#070a10] shadow-lg rounded-2xl" />
                </div>
                <div className="flex-1 min-w-0 pt-2 w-full">
                  <div className="flex items-start justify-between w-full select-none">
                    <div>
                      <h1 className="text-lg font-bold text-[#e6edf3] flex items-center gap-1.5 leading-tight">
                        {user.name}
                        <Award size={13} className="text-[#6366f1]" />
                      </h1>
                      <p className="text-[10px] text-muted font-mono">{user.email}</p>
                    </div>
                    {editing ? (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setBio(user.bio || '');
                            setGithub(user.github || '');
                            setSkills(user.skills);
                            setEditing(false);
                          }}
                          className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-muted hover:text-ink text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={11} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveProfile}
                          className="px-3.5 py-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border-none"
                        >
                          <Save size={11} /> Save
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#cbd5e1] hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#1e1e2e]"
                      >
                        <Edit3 size={11} /> Edit Profile
                      </button>
                    )}
                  </div>

                  {/* Bio */}
                  {editing ? (
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      rows={3}
                      className="w-full mt-3 border border-[#1e1e2e] bg-[#0a0a0f] text-ink placeholder:text-muted/40 p-2.5 text-xs rounded-lg focus:outline-none focus:border-[#6366f1]/60 resize-none font-light"
                      placeholder="Write a short bio..."
                    />
                  ) : (
                    <p className="text-xs text-muted mt-3 leading-relaxed font-light select-text">{user.bio || "No profile bio written yet."}</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] text-muted border-t border-[#1e1e2e]/30 pt-3 select-none">
                    <span className="flex items-center gap-1"><Calendar size={11} /> Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                    {github && (
                      <a href={github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                        <GitPullRequest size={11} /> GitHub Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Skills */}
            <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left">
              <CardContent className="py-5">
                <h3 className="text-xs font-bold text-[#e6edf3] mb-3 uppercase tracking-wider flex items-center gap-1 border-b border-[#1e1e2e]/20 pb-2 select-none">
                  <Sparkles size={12} className="text-[#6366f1] shrink-0" /> Skills & Tech
                </h3>
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex gap-1.5">
                      <input
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Add skill..."
                        className="flex-1 border border-[#1e1e2e] bg-[#0a0a0f] text-ink placeholder:text-muted/40 px-2 py-1 text-xs focus:outline-none focus:border-[#6366f1]/60 rounded-lg font-medium"
                      />
                      <button type="button" onClick={addSkill} className="px-2.5 py-1 bg-[#6366f1] text-white hover:bg-[#4f46e5] text-xs font-bold rounded-lg cursor-pointer border-none transition-colors">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      {skills.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8] text-[10px] font-semibold rounded-md">
                          {s}
                          <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))} className="hover:text-rose-400 font-bold cursor-pointer text-xs">&times;</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 select-none">
                    {user.skills.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#818cf8]">
                        {s}
                      </span>
                    ))}
                    {user.skills.length === 0 && (
                      <span className="text-xs text-muted font-light italic">No skills listed yet.</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left select-none">
              <CardContent className="py-5">
                <h3 className="text-xs font-bold text-[#e6edf3] mb-3 uppercase tracking-wider flex items-center gap-1 border-b border-[#1e1e2e]/20 pb-2">
                  <ListTodo size={12} className="text-[#6366f1] shrink-0" /> Task Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] border border-[#1e1e2e]/60 rounded-lg text-xs">
                    <span className="text-muted flex items-center gap-1"><ListTodo size={11} /> Assigned:</span>
                    <span className="font-bold text-ink">{assignedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] border border-[#1e1e2e]/60 rounded-lg text-xs">
                    <span className="text-muted flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-400" /> Completed:</span>
                    <span className="font-bold text-emerald-400">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] border border-[#1e1e2e]/60 rounded-lg text-xs">
                    <span className="text-muted flex items-center gap-1"><Percent size={11} /> Completion Rate:</span>
                    <span className="font-bold text-ink">
                      {assignedTasks > 0 ? Math.round(completedTasks / assignedTasks * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card className="border border-[#1e1e2e]/40 bg-[#0d1117]/60 text-left">
              <CardContent className="py-5">
                <h3 className="text-xs font-bold text-[#e6edf3] mb-3 uppercase tracking-wider flex items-center gap-1 border-b border-[#1e1e2e]/20 pb-2 select-none">
                  <GitPullRequest size={12} className="text-[#6366f1] shrink-0" /> Connected Accounts
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 border border-[#1e1e2e]/60 bg-[#0a0a0f] rounded-lg text-xs">
                    <span className="text-muted select-none">GitHub</span>
                    {editing ? (
                      <input
                        type="url"
                        value={github}
                        onChange={e => setGithub(e.target.value)}
                        placeholder="https://github.com/username"
                        className="bg-transparent border-none outline-none text-right text-xs text-ink max-w-[120px] font-mono"
                      />
                    ) : github ? (
                      <span className="text-xs text-emerald-400 font-semibold select-none">Connected</span>
                    ) : (
                      <span className="text-xs text-muted select-none">Not Connected</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
