import React from 'react';

export interface FunctionButtonProps {
  id: string;
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}

export const FunctionButton: React.FC<FunctionButtonProps> = ({
  label,
  badge,
  icon: Icon,
  isActive,
  onClick,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={`group relative flex items-center text-left rounded-lg transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 select-none ${
        isSm
          ? 'gap-2 px-2.5 py-1.5 min-h-[42px]'
          : 'gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[48px] sm:min-h-[52px]'
      } ${
        isActive
          ? 'bg-blue-600 text-white border border-blue-600 shadow-xs ring-1 ring-blue-500'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* Icon Capsule */}
      <div
        className={`rounded-md flex items-center justify-center shrink-0 transition-colors ${
          isSm ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'
        } ${
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
        }`}
      >
        <Icon className={isSm ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} />
      </div>

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <div
          className={`font-semibold tracking-tight truncate leading-tight ${
            isSm ? 'text-xs' : 'text-xs sm:text-[13px]'
          } ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}
        >
          {label}
        </div>
        <div
          className={`truncate leading-tight mt-0.5 font-medium ${
            isSm ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
          } ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'}`}
        >
          {badge}
        </div>
      </div>

      {/* Active Indicator pip */}
      {isActive && (
        <span
          className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-2xs"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
