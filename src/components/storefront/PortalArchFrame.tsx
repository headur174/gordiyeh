import React from 'react';

interface ArchPlinthBaseProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Two-tier architectural stepped plinth base matching the Gordiyeh Portal Arch motif:
 * Step 1 slightly wider than the arch columns; Step 2 slightly wider than Step 1.
 */
export const ArchPlinthBase: React.FC<ArchPlinthBaseProps> = ({
  size = 'md',
  className = '',
}) => {
  const step1Classes =
    size === 'sm'
      ? 'w-[calc(100%+8px)] -mx-[4px] h-[5px]'
      : size === 'lg'
      ? 'w-[calc(100%+14px)] sm:w-[calc(100%+22px)] -mx-[7px] sm:-mx-[11px] h-[6px] sm:h-[8px]'
      : 'w-[calc(100%+10px)] -mx-[5px] h-[5px] sm:h-[6px]';

  const step2Classes =
    size === 'sm'
      ? 'w-[calc(100%+16px)] -mx-[8px] h-[5px]'
      : size === 'lg'
      ? 'w-[calc(100%+28px)] sm:w-[calc(100%+44px)] -mx-[14px] sm:-mx-[22px] h-[6px] sm:h-[8px]'
      : 'w-[calc(100%+20px)] -mx-[10px] h-[5px] sm:h-[6px]';

  return (
    <div
      aria-hidden="true"
      className={`relative w-full flex flex-col items-center select-none pointer-events-none ${className}`}
    >
      <div
        className={`${step1Classes} -mt-[1.5px] bg-[var(--bg-card)] border-[1.5px] border-[var(--text-main)]/25 group-hover:border-[var(--border-active)] transition-colors z-10`}
      />
      <div
        className={`${step2Classes} -mt-[1.5px] bg-[var(--bg-main)] border-[1.5px] border-[var(--text-main)]/20 group-hover:border-[var(--border-active)]/80 transition-colors z-0`}
      />
    </div>
  );
};

interface ArchSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const ArchSectionHeader: React.FC<ArchSectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-3.5 border-b border-[var(--border-subtle)]">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2.5">
          {icon && <span className="text-[var(--accent-primary)] shrink-0">{icon}</span>}
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
