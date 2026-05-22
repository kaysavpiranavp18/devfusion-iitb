import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { Priority } from '../../types';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-elevated text-body',
  primary: 'bg-white/10 text-ink',
  success: 'bg-semantic-success/10 text-semantic-success',
  warning: 'bg-semantic-warning/10 text-semantic-warning',
  danger: 'bg-semantic-danger/10 text-semantic-danger',
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center font-medium rounded-none', variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = {
    p0: { label: 'P0', variant: 'danger' as const },
    p1: { label: 'P1', variant: 'warning' as const },
    p2: { label: 'P2', variant: 'default' as const },
  };
  const { label, variant } = config[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
