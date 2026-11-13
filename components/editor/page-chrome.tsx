import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppBrand() {
  return (
    <Link className="brand" href="/">
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 9 12 3l11 6-11 6-11-6Zm4 4 7 4 7-4v5l-7 4-7-4Z"/></svg>
      </span>
      <span><strong>Kartu Ujian Pro</strong><small>Generator Kartu Peserta</small></span>
    </Link>
  );
}

export function PageHeading({ title, description, badges, actions }: {
  title: string;
  description: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return <header className="page-heading">
    <div>
      {badges && <div className="data-badges">{badges}</div>}
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions && <div className="page-heading-actions">{actions}</div>}
  </header>;
}
