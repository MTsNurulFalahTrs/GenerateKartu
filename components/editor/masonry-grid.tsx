'use client';

import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function MasonryGrid({ className, children }: { className: string; children: ReactNode }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === 'undefined') return;

    let frame = 0;
    let previousColumns = 0;
    const observed = new Set<Element>();

    function layout() {
      if (!grid || !grid.clientWidth) return;
      const style = getComputedStyle(grid);
      const columns = Number(style.getPropertyValue('--masonry-columns')) || 1;
      if (columns === 1) {
        delete grid.dataset.masonryReady;
        previousColumns = 1;
        return;
      }
      const unit = Number(style.getPropertyValue('--masonry-unit'));
      const gap = Math.round((parseFloat(style.columnGap) || 0) / unit);
      const rows = Array<number>(columns).fill(1);
      const cards = Array.from(grid.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      if (columns !== previousColumns) {
        for (const card of cards) card.style.removeProperty('--masonry-column');
        previousColumns = columns;
      }
      // The last item in each column needs no trailing gap.
      const placements = cards.map((card) => {
        const fullWidth = card.hasAttribute('data-masonry-full');
        const column = fullWidth ? 0 : rows.indexOf(Math.min(...rows));
        const start = fullWidth ? Math.max(...rows) : rows[column];
        const height = Math.max(1, Math.ceil(card.getBoundingClientRect().height / unit));
        if (fullWidth) rows.fill(start + height + gap);
        else rows[column] = start + height + gap;
        return { card, column, start, height, fullWidth };
      });

      for (const { card, column, start, height, fullWidth } of placements) {
        card.style.setProperty('--masonry-column', fullWidth ? '1 / -1' : String(column + 1));
        card.style.setProperty('--masonry-row', `${start} / span ${height}`);
      }
      grid.dataset.masonryReady = '';
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    }

    const resize = new ResizeObserver(schedule);
    function syncChildren() {
      if (!grid) return;
      const children = new Set(Array.from(grid.children));
      for (const card of observed) {
        if (!children.has(card)) {
          resize.unobserve(card);
          observed.delete(card);
        }
      }
      for (const card of children) {
        if (!observed.has(card)) {
          resize.observe(card);
          observed.add(card);
        }
      }
      schedule();
    }

    const mutations = new MutationObserver(syncChildren);
    mutations.observe(grid, { childList: true });
    resize.observe(grid);
    syncChildren();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  return <div ref={gridRef} className={`masonry-grid ${className}`}>{children}</div>;
}
