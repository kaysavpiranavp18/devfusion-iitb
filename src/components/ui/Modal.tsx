import { type ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative bg-surface-card w-full animate-in border border-hairline',
        'max-h-[90vh] flex flex-col',
        sizeClasses[size],
        className,
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-hairline shrink-0">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-surface-elevated text-muted hover:text-body transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
