import { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, FileText, ListChecks, Brain } from 'lucide-react';
import { clsx } from 'clsx';
import { useTaskStore } from '../../store';

import { Button } from '../ui/Button';
import { format, differenceInDays } from 'date-fns';

type AIAction = 'summarize' | 'blockers' | 'standup' | 'breakdown';

interface AIAssistantProps {
  projectId: string;
}

export function AIAssistant({ projectId }: AIAssistantProps) {
  const { tasks } = useTaskStore();
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [result, setResult] = useState<string>('');
  const [showInput, setShowInput] = useState(false);

  const projectTasks = tasks.filter(t => t.projectId === projectId);

  const simulateAI = (action: AIAction) => {
    setLoading(true);
    setResult('');
    setActiveAction(action);

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
          output = `## 📊 Project Progress Summary\n\n**Overall Progress:** ${Math.round(done / total * 100)}% complete (${done}/${total} tasks done)\n\n**Task Breakdown:**\n- ✅ **Done:** ${done} tasks\n- 🔍 **In Review:** ${inReview} tasks\n- 🚧 **In Progress:** ${inProgress} tasks\n- 📋 **To Do:** ${todo} tasks\n\n**Urgent:** ${p0} high-priority (P0) tasks still need attention.\n\n**Team Velocity:** The team has completed ${done} tasks total across this project.`;
          break;
        }
        case 'blockers': {
          const stagnant = projectTasks.filter(t => {
            if (t.status !== 'in_progress') return false;
            const days = differenceInDays(new Date(), new Date(t.updatedAt));
            return days >= 3;
          });
          if (stagnant.length === 0) {
            output = `## 🎉 No Blockers Detected\n\nAll in-progress tasks have been updated recently. Great job staying on top of things!`;
          } else {
            output = `## 🚨 Potential Blockers\n\nThe following tasks have been "In Progress" for 3+ days without updates:\n\n${stagnant.map(t => {
              const days = differenceInDays(new Date(), new Date(t.updatedAt));
              return `- **${t.title}** — ${days} days without update (${t.priority.toUpperCase()})\n  Assigned to: ${t.assigneeId || 'Unassigned'}`;
            }).join('\n\n')}\n\n**Recommendation:** Check in with the assignees to unblock these tasks.`;
          }
          break;
        }
        case 'standup': {
          const recent = projectTasks.filter(t => {
            return differenceInDays(new Date(), new Date(t.updatedAt)) <= 1;
          });
          const recentlyDone = recent.filter(t => t.status === 'done');
          const recentlyMoved = recent.filter(t => t.status !== 'done');
          output = `## 📅 Daily Standup Report — ${format(new Date(), 'EEEE, MMMM d')}\n\n### ✅ Completed Yesterday\n${recentlyDone.length === 0 ? '- No tasks were completed yesterday' : recentlyDone.map(t => `- ${t.title}`).join('\n')}\n\n### 🚧 Working On\n${recentlyMoved.length === 0 ? '- No recent activity to report' : recentlyMoved.map(t => `- ${t.title} (${t.status.replace('_', ' ')})`).join('\n')}\n\n### ⚠️ Blockers\n${projectTasks.filter(t => t.status === 'in_progress' && differenceInDays(new Date(), new Date(t.updatedAt)) >= 3).map(t => `- ${t.title}`).join('\n') || '- None'}\n\n### 📋 Plan for Today\n- Continue current tasks\n- Address any blockers\n- Review pending PRs`;
          break;
        }
        case 'breakdown': {
          if (!featureInput.trim()) {
            setShowInput(true);
            setLoading(false);
            return;
          }
          output = `## 📋 Task Breakdown: "${featureInput}"\n\nBased on the feature description, here's a suggested breakdown:\n\n### 🎯 Epic: ${featureInput}\n\n1. **Design & Planning**\n   - Create UI/UX wireframes\n   - Define database schema\n   - Set up API endpoints\n\n2. **Frontend Implementation**\n   - Build main component structure\n   - Implement user interface\n   - Add form validation\n   - Responsive design\n\n3. **Backend Implementation**\n   - Create data models\n   - Implement API routes\n   - Add authentication/authorization\n   - Write unit tests\n\n4. **Integration & Testing**\n   - Connect frontend to backend\n   - End-to-end testing\n   - Performance optimization\n   - QA review\n\n5. **Deployment**\n   - CI/CD pipeline setup\n   - Staging deployment\n   - Production deployment\n   - Monitoring setup\n\n**Estimated Effort:** 5-8 days for a solo developer\n**Priority:** P1`;
          break;
        }
      }
      setResult(output);
      setLoading(false);
    }, 1200);
  };

  const actions: { id: AIAction; icon: any; label: string; description: string }[] = [
    { id: 'summarize', icon: Sparkles, label: 'Summarize Project', description: 'Get a progress summary with task statistics' },
    { id: 'blockers', icon: AlertTriangle, label: "What's Blocking Us?", description: 'Identify stagnant tasks in progress' },
    { id: 'standup', icon: FileText, label: 'Generate Standup', description: 'Create a daily standup from recent activity' },
    { id: 'breakdown', icon: ListChecks, label: 'Break Down Feature', description: 'AI generates subtasks from a description' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain size={20} className="text-m-blue-light" />
        <h2 className="text-lg font-bold text-ink uppercase tracking-normal">AI Project Assistant</h2>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === 'breakdown') {
                setShowInput(true);
              }
              simulateAI(action.id);
            }}
            disabled={loading}
            className={clsx(
              'flex items-start gap-3 p-4 border border-hairline text-left transition-all duration-150',
              activeAction === action.id
                ? 'bg-white/10 border-white/30'
                : 'bg-surface-card hover:bg-surface-elevated',
            )}
          >
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0">
              <action.icon size={20} className="text-ink" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink mb-0.5">{action.label}</h3>
              <p className="text-xs text-muted">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Feature input for breakdown */}
      {showInput && activeAction === 'breakdown' && (
        <div className="mb-4 p-4 bg-surface-card border border-hairline">
          <label className="block text-sm font-medium text-ink mb-2">
            Describe the feature you want broken down:
          </label>
          <div className="flex gap-2">
            <input
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              placeholder="e.g., Build a login system"
              className="flex-1 border border-hairline bg-surface-card text-ink placeholder:text-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
              onKeyDown={e => { if (e.key === 'Enter') simulateAI('breakdown'); }}
            />
            <Button size="sm" onClick={() => simulateAI('breakdown')} loading={loading}>
              Generate
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 p-6 bg-surface-card border border-hairline">
          <Loader2 size={20} className="animate-spin text-m-blue-light" />
          <span className="text-sm text-muted">AI is analyzing your project...</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="bg-surface-card border border-hairline overflow-hidden">
          <div className="px-5 py-3 bg-white/5 border-b border-hairline">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-m-blue-light" />
              <span className="text-sm font-bold text-ink">AI Response</span>
            </div>
          </div>            <div className="p-5">
            <div className="prose prose-sm max-w-none text-body whitespace-pre-line leading-relaxed font-light">
              {result}
            </div>
          </div>
        </div>
      )}

      {!activeAction && !loading && !result && (
        <div className="text-center py-16">
          <Brain size={48} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-medium text-muted mb-2">AI Assistant Ready</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Click any action above to get AI-powered insights about your project.
            The AI can summarize progress, detect blockers, generate standups, and break down features.
          </p>
        </div>
      )}
    </div>
  );
}
