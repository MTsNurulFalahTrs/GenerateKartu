import type { Metadata } from 'next';
import Link from 'next/link';
import { AppBrand } from '../../components/editor/page-chrome';
import { HelpShell } from '../../components/editor/help-shell';
import { HelpContent } from '../../components/editor/help-content';

export const metadata: Metadata = { title: 'Bantuan' };

export default function HelpPage() {
  return <HelpShell>
    <a className="skip-editor" href="#help-content">Lewati ke isi bantuan</a>
    <header className="header">
      <div className="header-inner">
        <AppBrand />
        <Link className="action" href="/">Kembali ke editor</Link>
      </div>
    </header>
    <main className="content help-content" id="help-content" tabIndex={-1}>
      <HelpContent />
    </main>
  </HelpShell>;
}
