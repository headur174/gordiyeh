import React from 'react';
import { GORDIYEH_BRAND } from '../gordiyehKit';

interface GordiyehLoaderProps {
  variant?: 'fullscreen' | 'inline';
  label?: string;
  sublabel?: string;
}

export const GordiyehLoader: React.FC<GordiyehLoaderProps> = ({
  variant = 'inline',
  label = 'در حال آماده‌سازی گُردیه...',
  sublabel = 'بارگذاری سبک و بهینه اطلاعات فروشگاه',
}) => {
  const isFullscreen = variant === 'fullscreen';

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-[var(--bg-main)]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 font-sans transition-opacity duration-300'
          : 'w-full min-h-[260px] flex flex-col items-center justify-center p-8 font-sans'
      }
    >
      <div className="flex flex-col items-center gap-4">
        {/* Miniature Iranian Arch Loader Portal */}
        <div className="relative flex flex-col items-center">
          <div className="gordiyeh-support-arch-outer relative p-[3px] rounded-t-[54px] rounded-b-[5px] animate-pulse">
            <div className="w-[74px] h-[78px] rounded-t-[50px] rounded-b-[3px] bg-[var(--bg-card)] p-[3px] relative overflow-hidden">
              <div className="gordiyeh-support-arch-inner w-full h-full rounded-t-[46px] rounded-b-[2px] flex items-center justify-center p-2.5 overflow-hidden">
                <img
                  src={GORDIYEH_BRAND.logoAsset}
                  alt="گُردیه"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain select-none"
                />
              </div>
            </div>
          </div>
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth1 w-[82px] h-[4px] rounded-t-[2px] border-x border-t"
          />
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth2 w-[90px] h-[4.5px] rounded-b-sm border shadow-sm"
          />
        </div>

        {/* Sleek Botanical Progress Bar */}
        <div className="w-44 h-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-[var(--accent-primary)] gordiyeh-loader-bar" />
        </div>

        <div className="text-center space-y-1">
          <div className="text-xs sm:text-sm font-bold text-[var(--text-main)]">{label}</div>
          {sublabel && (
            <div className="text-[11px] text-[var(--text-muted)]">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
};
