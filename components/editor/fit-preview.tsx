'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function FitPreview({ widthMm, children, magnification = 1 }: { widthMm: number; children: ReactNode; magnification?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number>();
  const naturalWidth = widthMm * 96 / 25.4;

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = available && naturalWidth > 0 ? Math.min(1, available / naturalWidth) : 1;
  return <div className="fit-preview" ref={frame} style={{ maxWidth: `${widthMm}mm` }}>
    <div style={{ width: `${widthMm}mm`, zoom: scale * magnification }}>{children}</div>
  </div>;
}
