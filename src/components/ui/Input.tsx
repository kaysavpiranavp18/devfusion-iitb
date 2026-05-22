import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full border px-3 py-2 text-sm transition-all duration-150',
            'bg-surface-card text-ink placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50',
            error ? 'border-semantic-danger/50 focus:ring-red/30 focus:border-semantic-danger' : 'border-hairline',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-semantic-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = 'Search...', ...props }, ref) => (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-9 pr-3 py-2 text-sm border border-hairline bg-surface-card text-ink',
          'placeholder:text-muted',
          'focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50',
          'transition-all duration-150',
          className,
        )}
        {...props}
      />
    </div>
  ),
);
SearchInput.displayName = 'SearchInput';
