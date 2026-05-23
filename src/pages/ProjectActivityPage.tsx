import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { AIAssistant } from '../components/ai/AIAssistant';
import { AICodeReview } from '../components/ai/AICodeReview';
import { useState } from 'react';
import { Activity, Sparkles, Shield } from 'lucide-react';
import { clsx } from 'clsx';

type Tab = 'activity' | 'ai-assistant' | 'ai-review';

export function ProjectActivityPage() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const [tab, setTab] = useState<Tab>('activity');

  const tabs = [
    { id: 'activity' as Tab, icon: Activity, label: 'Activity Feed' },
    { id: 'ai-assistant' as Tab, icon: Sparkles, label: 'AI Assistant' },
    { id: 'ai-review' as Tab, icon: Shield, label: 'AI Code Review' },
  ];

  return (
    <WorkspaceLayout>
      <div className="h-full flex flex-col">
        {/* Tabs */}
        <div className="bg-surface-card border-b border-hairline px-4 sm:px-6 flex gap-1 shrink-0 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap cursor-pointer',
                tab === t.id
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:text-body',
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {tab === 'activity' && (
            <ActivityFeed workspaceId={workspaceId!} projectId={projectId} />
          )}
          {tab === 'ai-assistant' && (
            <AIAssistant projectId={projectId!} />
          )}
          {tab === 'ai-review' && (
            <AICodeReview />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
