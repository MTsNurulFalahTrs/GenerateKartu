'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { CardPreview } from './card-preview';
import type { Participant } from '../../lib/participants/model';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { validCardLayout } from '../../lib/cards/settings';
import { cardPages, paper } from '../../lib/cards/print-layout';

export function CardOutput({ participants, renderCard, pending }: {
  participants: Participant[];
  renderCard: (participant: Participant) => CardRenderModel;
  pending: boolean;
}) {
  const [job, setJob] = useState<CardRenderModel[][] | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [columns, setColumns] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function output(kind: 'print' | 'pdf') {
    if (!participants.length || controller.current) return;
    const cards = participants.map((participant) => renderCard(participant));
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError(false);
    setMessage('Menyiapkan kartu…');
    try {
      const { settings } = cards[0];
      if (!validCardLayout(settings)) throw new Error('Periksa ukuran kartu dan ukuran teks di Layout & Cetak.');
      const { width, height } = settings;
      const layout = cardPages(cards, width, height);
      flushSync(() => { setColumns(layout.columns); setJob(layout.pages); });
      const deadline = performance.now() + 15000;
      const host = root.current;
      if (!host) throw new Error('Area keluaran tidak tersedia.');
      const imageCount = cards.reduce((total, card) => total +
        Number(!!card.assets.logoLeft) + Number(!!card.assets.logoRight) +
        Number(!!card.assets.signature) + Number(card.settings.photo && !!card.photo), 0);
      const wait = async () => {
        await document.fonts.ready;
        while (host.querySelectorAll('img').length !== imageCount) {
          current.signal.throwIfAborted();
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        await Promise.all(Array.from(host.querySelectorAll('img'), (image) => image.decode()));
      };
      const timeout = setTimeout(() => current.abort(new Error('Font atau gambar kartu belum siap setelah 15 detik.')), deadline - performance.now());
      try {
        await Promise.race([wait(), new Promise<never>((_, reject) =>
          current.signal.addEventListener('abort', () => reject(current.signal.reason), { once: true }))]);
      } finally {
        clearTimeout(timeout);
      }
      const pages = Array.from(host.querySelectorAll('.print-sheet'), (sheet) =>
        Array.from(sheet.querySelectorAll<HTMLElement>('.exam-card')));
      if (pages.length !== layout.pages.length || pages.some((page, index) => page.length !== layout.pages[index].length)) {
        throw new Error('Sebagian kartu gagal dirender. Periksa ukuran kartu.');
      }
      const clipped = pages.flat().find((card) => card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1);
      if (clipped) throw new Error(`Isi ${clipped.getAttribute('aria-label')} melebihi ukuran kartu. Perbesar kartu atau ringkas isinya.`);
      current.signal.throwIfAborted();
      if (kind === 'print') {
        document.body.classList.add('card-print-ready');
        try {
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => {
              window.removeEventListener('afterprint', finish);
              current.signal.removeEventListener('abort', cancel);
            };
            const finish = () => { cleanup(); resolve(); };
            const cancel = () => { cleanup(); reject(current.signal.reason); };
            window.addEventListener('afterprint', finish, { once: true });
            current.signal.addEventListener('abort', cancel, { once: true });
            try {
              window.print();
            } catch (cause) {
              cleanup();
              reject(cause);
            }
          });
        } finally {
          document.body.classList.remove('card-print-ready');
        }
        setMessage(`Dialog cetak ditutup · ${cards.length} kartu dalam ${pages.length} halaman.`);
      } else {
        const { buildCardPdf } = await import('../../lib/cards/pdf');
        const bytes = await buildCardPdf(pages, layout.columns, width, height, current.signal,
          (count) => setMessage(`Membuat PDF · ${count}/${cards.length} kartu`));
        current.signal.throwIfAborted();
        const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kartu-peserta-ujian.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(`PDF berisi ${cards.length} kartu dalam ${pages.length} halaman siap diunduh.`);
      }
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'Keluaran gagal dibuat.');
    } finally {
      controller.current = null;
      setBusy(false);
      setJob(null);
    }
  }

  return <>
    <div className="flex flex-wrap items-center gap-2">
      <button id="print-cards" type="button" className="action" disabled={busy || pending || !participants.length} onClick={() => void output('print')}>Cetak semua hasil</button>
      <button id="download-card-pdf" type="button" className="action" disabled={busy || pending || !participants.length} onClick={() => void output('pdf')}>Unduh PDF</button>
      {busy && <button type="button" className="action" onClick={() => controller.current?.abort(new Error('Pembuatan keluaran dibatalkan.'))}>Batalkan keluaran</button>}
    </div>
    {message && <p role={error ? 'alert' : 'status'}>{message}</p>}
    {job && createPortal(<div ref={root} className="card-print-root" aria-hidden="true">
      {job.map((page, index) => <div key={index} className="print-sheet" style={{
        gridTemplateColumns: `repeat(${columns}, ${page[0].settings.width}mm)`,
        gap: `${paper.gap}mm`,
      }}>{page.map((card) => <CardPreview key={card.participant.id} {...card} output />)}</div>)}
    </div>, document.body)}
  </>;
}
