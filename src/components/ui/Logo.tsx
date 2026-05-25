import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOrbits?: boolean;
  theme?: string;
}

export function Logo({ className, size = 'md', showOrbits = true, theme }: LogoProps) {
  const [activeTheme, setActiveTheme] = useState(theme || 'rose');

  useEffect(() => {
    if (theme) {
      setActiveTheme(theme);
    } else {
      const checkTheme = () => {
        const saved = localStorage.getItem('themeAccent') || 'rose';
        setActiveTheme(saved);
      };
      checkTheme();
      window.addEventListener('theme-changed', checkTheme);
      return () => {
        window.removeEventListener('theme-changed', checkTheme);
      };
    }
  }, [theme]);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={clsx('relative flex items-center justify-center shrink-0 select-none', sizeClasses[size], className)}>
      {/* Background glow matching the selected theme accent color */}
      <div 
        className="absolute inset-0 rounded-full blur-[8px] opacity-20 animate-[pulse_3s_ease-in-out_infinite]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
      
      {/* Dynamic Image Logo (gets updated based on selected theme) */}
      <div className="w-[78%] h-[78%] relative z-10 flex items-center justify-center">
        <img 
          src={`/favicons/${activeTheme}.png`} 
          alt="DevCollab Logo" 
          className="w-full h-full object-contain"
        />
      </div>

      {showOrbits && (
        <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100" fill="none">
          <defs>
            <filter id="logo-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Spinning orbiting track 1 (Primary theme color) */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="var(--color-primary)" 
            strokeWidth="2.2" 
            strokeDasharray="40 140" 
            className="animate-[spin_8s_linear_infinite]" 
            opacity="0.85" 
            filter="url(#logo-glow)" 
          />
          {/* Spinning orbiting track 2 (White) */}
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeDasharray="90 150" 
            className="animate-[spin_12s_linear_infinite_reverse]" 
            opacity="0.45" 
          />
        </svg>
      )}
    </div>
  );
}
