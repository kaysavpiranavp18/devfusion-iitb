import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  online?: boolean;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-14 h-14 text-lg',
};

const dotSizes = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
  xl: 'w-3 h-3',
};

const bgColors = [
  'bg-white', 'bg-semantic-success', 'bg-semantic-warning', 'bg-semantic-danger',
  'bg-cyan-500', 'bg-m-blue-light', 'bg-pink-500', 'bg-teal-500',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return bgColors[Math.abs(hash) % bgColors.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function Avatar({ src, name, size = 'md', className, showStatus, online }: AvatarProps) {
  return (
    <div className={clsx('relative inline-flex shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={clsx('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div className={clsx(
          'rounded-full flex items-center justify-center font-medium',
          getColor(name) === 'bg-white' ? 'text-black' : 'text-white',
          getColor(name),
          sizeClasses[size],
        )}>
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <span className={clsx(
          'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white',
          dotSizes[size],
          online ? 'bg-semantic-success' : 'bg-ink-tertiary/50',
        )} />
      )}
    </div>
  );
}
