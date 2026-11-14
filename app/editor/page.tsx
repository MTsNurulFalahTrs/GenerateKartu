import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseChangelog } from '../../lib/changelog';
import type { Metadata } from 'next';
import { CardEditor } from '../../components/editor/card-editor';

export const metadata: Metadata = { title: 'Editor Kartu Peserta' };

export default function EditorPage() {
  return <CardEditor changelog={parseChangelog(readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8'))} />;
}
