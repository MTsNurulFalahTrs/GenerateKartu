'use client';

import { notify } from '../../lib/ui/notify';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { EditorIcon } from './editor-icon';
import { CardPreview } from './card-preview';
import type { Participant } from '../../lib/participants/model';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { validCardLayout } from '../../lib/cards/settings';
import { cardPages, pageGrid } from '../../lib/cards/print-layout';

const pdfCanceled = new Error('Pembuatan PDF dibatalkan.');

const pageLabel = (layout: ReturnType<typeof cardPages>) =>
  `${layout.paper.size} · ${layout.paper.orientation === 'landscape' ? 'Lanskap' : 'Potret'}`;

function PrintSheet({ cards, layout }: {
  cards: CardRenderModel[];
  layout: ReturnType<typeof cardPages<CardRenderModel>>;
}) {
  const grid = pageGrid(layout, cards.length);
  return <div className="print-sheet" style={{
    width: `${layout.sheet.width}mm`,
    height: `${layout.sheet.height}mm`,
    gridTemplateColumns: `repeat(${grid.columns}, ${layout.width}mm)`,
    gridAutoRows: `${layout.height}mm`,
    paddingLeft: `${grid.left}mm`,
    paddingTop: `${grid.top}mm`,
    gap: `${layout.gap}mm`,
  }}>{cards.map((card) => <CardPreview key={card.participant.id} {...card} output />)}</div>;
}

export function CardOutput({ participants, renderCard, pending }: {
  participants: Participant[];
  renderCard: (participant: Participant) => CardRenderModel;
  pending: boolean;
}) {
  const pdfDialog = useRef<HTMLDialogElement>(null);
  const pdfTrigger = useRef<HTMLButtonElement>(null);
  const [pdfProgress, setPdfProgress] = useState<{ cards: number; done: number; pages: number; paper: string }>();
  const [cancelingPdf, setCancelingPdf] = useState(false);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState<ReturnType<typeof cardPages<CardRenderModel>> | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [job, setJob] = useState<ReturnType<typeof cardPages<CardRenderModel>> | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  function openPreview() {
    if (!participants.length) return;
    try {
      const cards = participants.map((participant) => renderCard(participant));
      const { settings } = cards[0];
      if (!validCardLayout(settings)) throw new Error('Periksa ukuran kartu dan ukuran teks di Layout & Cetak.');
      setPreviewPage(0);
      setPreview(cardPages(cards, settings.width, settings.height, settings.paper));
      setMessage('');
      previewDialog.current?.showModal();
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : 'Pratinjau kertas gagal dibuka.');
    }
  }

  function cancelPdf() {
    if (!controller.current || controller.current.signal.aborted) return;
    controller.current.abort(pdfCanceled);
    setCancelingPdf(true);
  }

  async function output(kind: 'print' | 'pdf') {
    if (!participants.length || controller.current) return;
    const cards = participants.map((participant) => renderCard(participant));
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setMessage('Menyiapkan kartu…');
    try {
      const { settings } = cards[0];
      if (!validCardLayout(settings)) throw new Error('Periksa ukuran kartu dan ukuran teks di Layout & Cetak.');
      const { width, height } = settings;
      const layout = cardPages(cards, width, height, settings.paper);
      flushSync(() => {
        setJob(layout);
        if (kind === 'pdf') setPdfProgress({ cards: cards.length, done: 0, pages: layout.pages.length, paper: pageLabel(layout) });
      });
      if (kind === 'pdf') pdfDialog.current?.showModal();
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
        notify('info', 'Dialog cetak ditutup.');
      } else {
        const { buildCardPdf } = await import('../../lib/cards/pdf');
        const bytes = await buildCardPdf(pages, layout, current.signal,
          (done) => setPdfProgress((previous) => previous && { ...previous, done }));
        current.signal.throwIfAborted();
        const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kartu-peserta-ujian.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify('success', `PDF berisi ${cards.length} kartu dalam ${pages.length} halaman siap diunduh.`);
      }
    } catch (cause) {
      if (cause === pdfCanceled) notify('info', pdfCanceled.message);
      else if (cause !== current.signal.reason || current.signal.reason instanceof Error) {
        notify('error', cause instanceof Error ? cause.message : 'Keluaran gagal dibuat.');
      }
    } finally {
      controller.current = null;
      setBusy(false);
      setJob(null);
      if (kind === 'pdf' && pdfDialog.current?.open) {
        pdfDialog.current.close();
        setPdfProgress(undefined);
        setCancelingPdf(false);
        requestAnimationFrame(() => pdfTrigger.current?.focus({ preventScroll: true }));
      }
    }
  }

  return <>
    <div className="print-actions">
      <button id="preview-a4" type="button" className="action" disabled={busy || pending || !participants.length} onClick={openPreview}><EditorIcon name="document" /> Pratinjau Kertas</button>
      <button id="download-card-pdf" ref={pdfTrigger} aria-haspopup="dialog" type="button" className="action" disabled={busy || pending || !participants.length} onClick={() => void output('pdf')}><EditorIcon name="download" /> Unduh PDF</button>
      <button id="print-cards" type="button" className="action action-primary data-next" disabled={busy || pending || !participants.length} onClick={() => void output('print')}><EditorIcon name="printer" /> Cetak ke Kertas</button>
      {busy && !pdfProgress && <button type="button" className="action" onClick={() => controller.current?.abort(new Error('Pembuatan keluaran dibatalkan.'))}>Batalkan keluaran</button>}
    </div>
    {busy && !pdfProgress && message && <p role="status">{message}</p>}
    <dialog className="format-dialog pdf-progress-dialog" ref={pdfDialog}
      aria-labelledby="pdf-progress-title" aria-describedby="pdf-progress-description"
      onCancel={(event) => { event.preventDefault(); cancelPdf(); }}>
      {pdfProgress && <>
        <header>
          <span className="pdf-progress-icon"><EditorIcon name="document" /></span>
          <div><h2 id="pdf-progress-title">Menyiapkan PDF</h2>
            <p id="pdf-progress-description">Unduhan dimulai otomatis setelah file siap.</p></div>
        </header>
        <div className="pdf-progress-body">
          <dl>
            <div><dt>Kartu</dt><dd>{pdfProgress.cards}</dd></div>
            <div><dt>Halaman</dt><dd>{pdfProgress.pages}</dd></div>
            <div><dt>Kertas</dt><dd>{pdfProgress.paper}</dd></div>
          </dl>
          <div className="pdf-progress-status">
            <strong role="status">{cancelingPdf ? 'Membatalkan…' : pdfProgress.done === 0 ? 'Menyiapkan kartu dan aset…'
              : pdfProgress.done === pdfProgress.cards ? 'Menyelesaikan file PDF…' : 'Menyusun kartu ke PDF…'}</strong>
            <span>{pdfProgress.done} / {pdfProgress.cards} kartu</span>
          </div>
          <progress aria-label="Kartu yang diproses" max={pdfProgress.cards} value={pdfProgress.done} />
          <p><EditorIcon name="lock" /> PDF dibuat di perangkat Anda.</p>
        </div>
        <footer><button type="button" className="action" autoFocus disabled={cancelingPdf}
          onClick={cancelPdf}>Batalkan pembuatan PDF</button></footer>
      </>}
    </dialog>
    <dialog className="format-dialog print-a4-dialog" ref={previewDialog} aria-labelledby="print-a4-title" onClose={() => setPreview(null)}>
      <header><h2 id="print-a4-title">Pratinjau Kertas{preview && ` · ${pageLabel(preview)}`}</h2>
        <button type="button" className="action action-icon" aria-label="Tutup pratinjau kertas" onClick={() => previewDialog.current?.close()}><EditorIcon name="close" /></button>
      </header>
      {preview && <>
        <div className="print-a4-scroll" tabIndex={0} role="region" aria-label={`Lembar ${pageLabel(preview)}`}>
          <PrintSheet cards={preview.pages[previewPage]} layout={preview} />
        </div>
        <footer className="print-a4-controls">
          <button type="button" className="action" disabled={previewPage === 0} onClick={() => setPreviewPage(previewPage - 1)}>Sebelumnya</button>
          <span role="status">Halaman {previewPage + 1} dari {preview.pages.length}</span>
          <button type="button" className="action" disabled={previewPage + 1 >= preview.pages.length} onClick={() => setPreviewPage(previewPage + 1)}>Berikutnya</button>
        </footer>
      </>}
    </dialog>
    {job && createPortal(<div ref={root} className="card-print-root" aria-hidden="true">
      <style>{`@media print { @page { size: ${job.sheet.width}mm ${job.sheet.height}mm; margin: 0; } }`}</style>
      {job.pages.map((page, index) => <PrintSheet key={index} cards={page} layout={job} />)}
    </div>, document.body)}
  </>;
}
