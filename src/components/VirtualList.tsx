import React, { useState, useRef, useEffect, UIEvent } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number; // estimated or exact height per item in px
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number | string;
  overscan?: number;
  className?: string;
  emptyPlaceholder?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 720,
  overscan = 5,
  className = '',
  emptyPlaceholder = null,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof containerHeight === 'number' ? containerHeight : 720
  );

  // Measure container height dynamically if possible
  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      if (height > 0) {
        setViewportHeight(height);
      }
    }
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalCount = items.length;
  if (totalCount === 0) {
    return <>{emptyPlaceholder}</>;
  }

  const totalHeight = totalCount * itemHeight;

  // Calculate visible range with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(totalCount, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto relative contain-content will-change-scroll ${className}`}
      style={{
        height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
      }}
    >
      {/* Phantom spacer to create natural scrollbar */}
      <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
        {/* Rendered window shifted to offsetY */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
          className="space-y-2.5"
        >
          {visibleItems.map((item, idx) => renderItem(item, startIndex + idx))}
        </div>
      </div>
    </div>
  );
}
