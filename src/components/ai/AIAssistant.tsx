import { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, AlertTriangle, Brain, Calendar, GitFork, Copy, Check, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useTaskStore } from '../../store';
import { Button } from '../ui/Button';
import { format, differenceInDays } from 'date-fns';

type AIAction = 'summarize' | 'blockers' | 'standup' | 'breakdown';

interface AIAssistantProps {
  projectId: string;
}

export function AIAssistant({ projectId }: AIAssistantProps) {
  const { tasks, addTask } = useTaskStore();
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [streamedResult, setStreamedResult] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imported, setImported] = useState(false);

  const typingIntervalRef = useRef<any>(null);
  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const runTypewriter = (text: string) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    setStreamedResult('');
    let index = 0;
    typingIntervalRef.current = setInterval(() => {
      setStreamedResult(prev => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      }
    }, 15); // Custom 15ms character speed as requested
  };

  const parseStreamedTasks = (streamedText: string): { title: string; priority: 'p0' | 'p1' | 'p2'; isDone: boolean }[] => {
    if (!streamedText) return [];
    const lines = streamedText.split('\n').filter(line => line.trim().startsWith('[TASK]'));
    return lines.map(line => {
      const content = line.replace(/^\[TASK\]\s*/i, '');
      const parts = content.split('|');
      const title = parts[0]?.trim() || '';
      const priorityStr = parts[1]?.trim().toLowerCase() || 'p1';
      const priority: 'p0' | 'p1' | 'p2' = (priorityStr === 'p0' || priorityStr === 'p1' || priorityStr === 'p2') ? priorityStr : 'p1';
      const isDone = line.includes('|');
      return { title, priority, isDone };
    });
  };

  const simulateAI = (action: AIAction, overrideInput?: string) => {
    const inputVal = overrideInput !== undefined ? overrideInput : featureInput;
    if (action === 'breakdown' && !inputVal.trim()) {
      setShowInput(true);
      setActiveAction('breakdown');
      return;
    }

    setLoading(true);
    setStreamedResult('');
    setActiveAction(action);
    setImported(false);

    setTimeout(() => {
      let output = '';
      switch (action) {
        case 'summarize': {
          const todo = projectTasks.filter(t => t.status === 'todo').length;
          const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
          const inReview = projectTasks.filter(t => t.status === 'in_review').length;
          const done = projectTasks.filter(t => t.status === 'done').length;
          const total = projectTasks.length;
          const p0 = projectTasks.filter(t => t.priority === 'p0' && t.status !== 'done').length;
          output = `PROJECT PROGRESS SUMMARY\n========================\n\nOverall Progress: ${total > 0 ? Math.round(done / total * 100) : 0}% complete (${done}/${total} tasks completed)\n\nTask Breakdown:\n- Done:        ${done} task(s)\n- In Review:   ${inReview} task(s)\n- In Progress: ${inProgress} task(s)\n- To Do:       ${todo} task(s)\n\nCritical Alert:\n- P0 tasks remaining: ${p0} high-priority task(s) require immediate actions.\n\nTeam Velocity:\n- Completed Tasks: ${done} total across project.`;
          break;
        }
        case 'blockers': {
          const stagnant = projectTasks.filter(t => {
            if (t.status !== 'in_progress') return false;
            const days = differenceInDays(new Date(), new Date(t.updatedAt));
            return days >= 3;
          });
          if (stagnant.length === 0) {
            output = `STAGNANT TASK & BLOCKER ANALYSIS\n===============================\n\nNo blockers detected. All in-progress tasks have been updated recently. Great velocity!`;
          } else {
            output = `STAGNANT TASK & BLOCKER ANALYSIS\n===============================\n\nStagnant tasks (In Progress for 3+ days without updates):\n\n${stagnant.map(t => {
              const days = differenceInDays(new Date(), new Date(t.updatedAt));
              return `- [${t.priority.toUpperCase()}] ${t.title}\n  * Unchanged: ${days} days\n  * Assignee: ${t.assigneeId || 'Unassigned'}`;
            }).join('\n\n')}\n\nRecommendation: Schedule syncs with assignees immediately to resolve potential bottlenecks.`;
          }
          break;
        }
        case 'standup': {
          const recent = projectTasks.filter(t => {
            return differenceInDays(new Date(), new Date(t.updatedAt)) <= 1;
          });
          const recentlyDone = recent.filter(t => t.status === 'done');
          const recentlyMoved = recent.filter(t => t.status !== 'done');
          output = `DAILY STANDUP REPORT: ${format(new Date(), 'yyyy-MM-dd')}\n==========================================\n\n1. Completed Yesterday:\n${recentlyDone.length === 0 ? '   - None' : recentlyDone.map(t => `   - ${t.title}`).join('\n')}\n\n2. Working On (Today):\n${recentlyMoved.length === 0 ? '   - No recent activity to report' : recentlyMoved.map(t => `   - ${t.title} [Status: ${t.status.toUpperCase()}]`).join('\n')}\n\n3. Blockers:\n${projectTasks.filter(t => t.status === 'in_progress' && differenceInDays(new Date(), new Date(t.updatedAt)) >= 3).map(t => `   - ${t.title}`).join('\n') || '   - None'}\n\n4. Recommended Next Steps:\n   - Review open PRs\n   - Sync up with blocked resources\n   - Update Kanban boards`;
          break;
        }
        case 'breakdown': {
          output = `[TASK] Design database schema & API endpoints for ${inputVal} | p0\n[TASK] Implement frontend UI and validation for ${inputVal} | p1\n[TASK] Develop backend service logic and logic filters for ${inputVal} | p1\n[TASK] Write unit tests & perform staging QA for ${inputVal} | p2`;
          break;
        }
      }
      setLoading(false);
      runTypewriter(output);
    }, 1200);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(streamedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportTasks = () => {
    const subtasks = parseStreamedTasks(streamedResult);
    subtasks.forEach((sub, index) => {
      addTask({
        id: `t-ai-${Date.now()}-${index}`,
        projectId: projectId,
        title: sub.title,
        description: `Automatically generated subtask for: ${featureInput}`,
        status: 'todo',
        priority: sub.priority,
        labels: ['AI-Generated', 'Feature-Breakdown'],
        attachments: [],
        comments: [],
        order: 100 + index,
        createdBy: 'u1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
    setImported(true);
    setTimeout(() => setImported(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const actions: { id: AIAction; icon: any; label: string; description: string }[] = [
    { id: 'summarize', icon: Sparkles, label: 'Summarize Project', description: 'Get progress statistics' },
    { id: 'blockers', icon: AlertTriangle, label: "What's Blocking Us?", description: 'Identify stagnant tasks' },
    { id: 'standup', icon: Calendar, label: 'Generate Standup', description: 'Create daily updates' },
    { id: 'breakdown', icon: GitFork, label: 'Break Down Feature', description: 'AI generates subtasks' },
  ];

  const parsedBreakdownTasks = parseStreamedTasks(streamedResult);

  // Compute breakdown output target length to check completion
  const breakdownTarget = `[TASK] Design database schema & API endpoints for ${featureInput} | p0\n[TASK] Implement frontend UI and validation for ${featureInput} | p1\n[TASK] Develop backend service logic and logic filters for ${featureInput} | p1\n[TASK] Write unit tests & perform staging QA for ${featureInput} | p2`;
  const isBreakdownFinished = activeAction === 'breakdown' && streamedResult.length >= breakdownTarget.length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2 pb-2 border-b border-hairline/50">
        <Brain size={18} className="text-primary" />
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Project Copilot</h2>
      </div>

      {/* Action cards in 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map(action => {
          const isBreakdown = action.id === 'breakdown';
          return (
            <div key={action.id} className="flex flex-col w-full gap-2">
              <button
                onClick={() => {
                  if (isBreakdown) {
                    setShowInput(prev => !prev);
                    setActiveAction('breakdown');
                    setStreamedResult('');
                  } else {
                    setShowInput(false);
                    simulateAI(action.id);
                  }
                }}
                disabled={loading}
                className={clsx(
                  'flex items-center gap-3 p-3.5 border border-hairline text-left transition-all duration-200 rounded-xl cursor-pointer w-full',
                  'hover:-translate-y-0.5 hover:border-l-[3px] hover:border-l-primary hover:bg-surface-elevated/80',
                  activeAction === action.id
                    ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20 border-l-[3px] border-l-primary'
                    : 'bg-surface-card border-hairline',
                )}
              >
                <div className="w-9 h-9 bg-primary/10 flex items-center justify-center shrink-0 rounded-lg">
                  <action.icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-ink truncate">{action.label}</h3>
                  <p className="text-[10px] text-muted truncate">{action.description}</p>
                </div>
              </button>

              {/* Inline input directly below "Break Down Feature" button */}
              {isBreakdown && showInput && (
                <div className="p-3 bg-surface-card border border-hairline rounded-xl space-y-2.5 w-full">
                  <label className="block text-[10px] font-bold text-ink uppercase tracking-wider">
                    Feature Description
                  </label>
                  <input
                    value={featureInput}
                    onChange={e => setFeatureInput(e.target.value)}
                    placeholder="Describe a feature... e.g. Build a login system"
                    className="w-full border border-hairline bg-canvas text-ink placeholder:text-muted px-2.5 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    onKeyDown={e => { if (e.key === 'Enter') simulateAI('breakdown'); }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={() => setShowInput(false)} className="text-[10px] bg-transparent border border-hairline hover:bg-white/[0.04] text-muted hover:text-ink py-1 px-2.5 rounded-lg no-hover-lift">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => simulateAI('breakdown')} loading={loading} className="text-[10px] bg-primary text-white py-1 px-3 rounded-lg">
                      Submit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2.5 p-6 bg-surface-card border border-hairline rounded-xl">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span className="text-xs text-muted">Analyzing project data...</span>
        </div>
      )}

      {/* Typewriter Results Output */}
      {streamedResult && !loading && (
        <div className="bg-[#0b0b10] border-l-[3px] border-l-primary border-y border-r border-hairline rounded-xl overflow-hidden shadow-lg relative group">
          <div className="px-4 py-2.5 bg-surface-elevated/40 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">AI Copilot Analysis</span>
            </div>
            <button
              onClick={handleCopyOutput}
              className="px-2 py-1 text-[10px] font-medium text-muted hover:text-ink bg-surface-card border border-hairline rounded hover:bg-surface-elevated transition-all flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={10} className="text-semantic-success" />
                  <span className="text-semantic-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={10} />
                  <span>Copy output</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 max-h-[380px] overflow-y-auto">
            {activeAction === 'breakdown' ? (
              <div className="space-y-4 font-sans">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-ink uppercase tracking-wider block">
                      AI Generated Subtasks for "{featureInput || 'Feature'}"
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {parsedBreakdownTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "bg-surface-card border p-3.5 rounded-xl flex items-center justify-between transition-all duration-300",
                          task.isDone ? "border-[#1e1e2e] shadow-sm" : "border-primary/20 bg-primary/[0.01] shadow-none"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-5 h-5 rounded-md border border-hairline flex items-center justify-center shrink-0 bg-[#0a0a0f]">
                            {task.isDone ? (
                              <Check size={10} className="text-semantic-success" />
                            ) : (
                              <Loader2 size={10} className="animate-spin text-primary" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-ink truncate leading-none">
                            {task.title}
                            {!task.isDone && <span className="animate-pulse text-primary ml-0.5">|</span>}
                          </span>
                        </div>
                        {task.isDone && (
                          <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in-75 duration-300">
                            <span className={clsx(
                              "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                              task.priority === 'p0' && "bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20",
                              task.priority === 'p1' && "bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20",
                              task.priority === 'p2' && "bg-semantic-success/10 text-semantic-success border-semantic-success/20",
                            )}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isBreakdownFinished && (
                  <div className="pt-3 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Button
                      size="sm"
                      onClick={handleImportTasks}
                      disabled={imported}
                      className={clsx(
                        "text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all font-semibold",
                        imported ? "bg-semantic-success/20 text-semantic-success border border-semantic-success/30" : "bg-primary text-white"
                      )}
                    >
                      {imported ? (
                        <>
                          <Check size={12} />
                          <span>Imported Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={12} />
                          <span>Import Tasks to Board</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <pre className="text-white font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                {streamedResult}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Premium Copilot Ready State */}
      {!activeAction && !loading && !streamedResult && (
        <div className="text-center py-12 px-4 border border-dashed border-hairline/60 bg-surface-card/20 rounded-xl relative overflow-hidden">
          <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="relative w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <Brain size={22} className="text-primary" />
            </div>
          </div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-1.5">Copilot is Ready</h3>
          <p className="text-[11px] text-muted max-w-sm mx-auto leading-relaxed mb-5">
            Click any task helper above or select a demo prompt below to instantly analyze task statuses, generate standups, or breakdown features.
          </p>
          
          {/* 3 Clickable Chips for Quick Demos */}
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={() => simulateAI('summarize')}
              className="text-[10px] bg-[#111118] hover:bg-white/[0.04] text-ink hover:text-white border border-[#1e1e2e] py-1.5 px-3 rounded-lg text-left transition-all hover:translate-y-[-1px] cursor-pointer flex items-center gap-2"
            >
              <Sparkles size={11} className="text-primary shrink-0" />
              <span className="truncate">📊 Summarize the current progress</span>
            </button>
            <button
              onClick={() => simulateAI('blockers')}
              className="text-[10px] bg-[#111118] hover:bg-white/[0.04] text-ink hover:text-white border border-[#1e1e2e] py-1.5 px-3 rounded-lg text-left transition-all hover:translate-y-[-1px] cursor-pointer flex items-center gap-2"
            >
              <AlertTriangle size={11} className="text-semantic-warning shrink-0" />
              <span className="truncate">⚠️ Identify active blockers</span>
            </button>
            <button
              onClick={() => {
                setFeatureInput('Implement dual-factor JWT auth');
                simulateAI('breakdown', 'Implement dual-factor JWT auth');
              }}
              className="text-[10px] bg-[#111118] hover:bg-white/[0.04] text-ink hover:text-white border border-[#1e1e2e] py-1.5 px-3 rounded-lg text-left transition-all hover:translate-y-[-1px] cursor-pointer flex items-center gap-2"
            >
              <GitFork size={11} className="text-primary shrink-0" />
              <span className="truncate">🌳 Break down: "Implement JWT auth"</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
