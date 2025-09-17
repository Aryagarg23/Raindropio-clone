import React from 'react';
import { ChevronRight } from 'lucide-react';

interface IconArrowButtonProps {
  onClick?: () => void;
  ariaLabel: string;
  variant?: 'light' | 'dark';
  isHovered?: boolean;
}

export const IconArrowButton: React.FC<IconArrowButtonProps> = ({
  onClick,
  ariaLabel,
  variant = 'light',
  isHovered = false
}) => {
  const isDark = variant === 'dark';

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        flex items-center justify-center
        h-10 w-10
        rounded-full
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDark
          ? 'text-white focus:ring-white/50'
          : 'text-slate-600 focus:ring-slate-400'
        }
        ${isHovered
          ? isDark
            ? 'bg-white/30 shadow-lg'
            : 'bg-slate-300 text-slate-900 shadow-lg'
          : ''
        }
      `}
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  );
};