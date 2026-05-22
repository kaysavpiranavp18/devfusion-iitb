import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex gap-1 border-b border-hairline', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}            className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150',
            'hover:text-ink whitespace-nowrap',
            activeTab === tab.id
              ? 'border-white text-ink'
              : 'border-transparent text-muted',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx(
              'text-xs rounded-full px-1.5 py-0.5',
              activeTab === tab.id ? 'bg-white/10 text-ink' : 'bg-surface-elevated text-muted',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
