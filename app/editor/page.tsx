import type { Metadata } from 'next';
import { CardEditor } from '../../components/editor/card-editor';

export const metadata: Metadata = { title: 'Editor Kartu Peserta' };

export default function EditorPage() {
  return <CardEditor />;
}
