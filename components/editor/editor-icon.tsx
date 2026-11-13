const paths = {
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 10v6 M14 10v6',
  monitor: 'M3 4h18v13H3z M8 21h8 M12 17v4',
  users: 'M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M7 20v-2a5 5 0 0 1 10 0v2z M7 12a4 4 0 0 0-4 4v4h2 M17 12a4 4 0 0 1 4 4v4h-2',
  clipboard: 'M8 5H4v16h16V5h-4 M8 3h8v5H8z',
  calendar: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M7 14h4',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21v-2a8 5 0 0 1 16 0v2z',
  building: 'M5 21V3h14v18 M3 21h18 M10 21v-4h4v4 M9 7h1 M14 7h1 M9 12h1 M14 12h1',
  home: 'M2 11 12 3l10 8 M5 10v11h14V10 M10 21v-7h4v7',
  edit: 'M12 4H4v16h16v-8 M9 15l1-4 9-9 3 3-9 9z',
  eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  excel: 'M5 3h9l5 5v13H5z M13 3v6h6 M8 17v-3 M12 17v-5 M16 17v-2',
  image: 'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 8h.01',
  lock: 'M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3',
  upload: 'M8 17H6a4 4 0 0 1-1-8 7 7 0 0 1 13-1 5 5 0 0 1 0 9h-2 M12 22V11m-4 4 4-4 4 4',
  table: 'M3 4h18v16H3z M3 9h18 M3 14h18 M11 4v16',
  plus: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M7 12h10 M12 7v10',
  document: 'M5 3h9l5 5v13H5z M13 3v6h6 M8 13h8 M8 17h6',
  download: 'M12 3v12m-4-4 4 4 4-4 M4 15v5h16v-5',
  printer: 'M6 8V3h12v5 M6 17H3V8h18v9h-3 M6 14h12v7H6z M17 11h1',
  filter: 'M3 4h18l-7 8v6l-4 2v-8z',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M15 15l6 6',
} as const;

export function EditorIcon({ name }: { name: keyof typeof paths }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[name]} />
  </svg>;
}
