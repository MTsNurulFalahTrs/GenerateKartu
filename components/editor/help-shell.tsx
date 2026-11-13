'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { parseBackup, storageKey } from '../../lib/cards/preferences';

export function HelpShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setDark(parseBackup(saved, false).preferences.dark);
      } catch {
        // The guide remains readable when browser storage is unavailable.
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <div className="editor help-shell" data-theme={dark ? 'dark' : 'light'}>{children}</div>;
}
