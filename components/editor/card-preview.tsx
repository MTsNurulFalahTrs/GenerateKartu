'use client';

import { useEffect, useMemo, useState } from 'react';
import { fieldsFor } from '../../lib/participants/model';
import type { Field } from '../../lib/participants/model';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { qrPath } from '../../lib/cards/qr';

const labels: Record<Field, string> = {
  NamaMurid: 'Nama', NoPeserta: 'No. Peserta', NISN: 'NISN', Kelas: 'Kelas',
  Ruang: 'Ruang', Sesi: 'Sesi', Username: 'Username', TglLahir: 'Tgl. Lahir', NamaSatdik: 'Satdik',
};

export function CardImage({ blob, label }: { blob?: Blob; label: string }) {
  const [image, setImage] = useState<{ blob: Blob; url: string }>();
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const frame = requestAnimationFrame(() => setImage({ blob, url }));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [blob]);
  return blob && image?.blob === blob
    // A local object URL never crosses the Next.js image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className="card-asset" src={image.url} alt={label} /> : null;
}

function CardQr({ reference }: { reference: string }) {
  const qr = useMemo(() => qrPath(reference), [reference]);
  return <svg aria-label="QR referensi kartu" role="img" viewBox={`0 0 ${qr.size} ${qr.size}`} className="card-qr" shapeRendering="crispEdges">
    <rect width={qr.size} height={qr.size} fill="#fff" /><path d={qr.path} fill="#000" />
  </svg>;
}

export function CardPreview({ format, custom, participant, photo, settings, assets, hidden, output = false }: CardRenderModel & { output?: boolean }) {
  const [overflow, setOverflow] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (output || !element) return;
    const content = element.firstElementChild;
    function check() {
      if (element && element.clientHeight > 0) setOverflow(element.scrollHeight > element.clientHeight + 1);
    }
    const observer = new ResizeObserver(check);
    observer.observe(element);
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [element, output]);

  const valid = settings.width >= 60 && settings.width <= 180 && settings.height >= 40 && settings.height <= 150 && settings.fontSize >= 6 && settings.fontSize <= 12;
  if (!valid) return <p role="alert">Gunakan lebar 60–180 mm, tinggi 40–150 mm, dan teks 6–12 pt.</p>;
  const fields = fieldsFor(format, custom).filter((field) => field === 'NamaMurid' || field === (format === 0 ? 'Username' : 'NoPeserta') || !hidden.includes(field));
  const schedule = settings.showSchedule ? settings.schedule.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  return <div className="card-preview-wrap">
    <article ref={output ? undefined : setElement} className="exam-card" data-bw={settings.monochrome}
      style={{ width: `${settings.width}mm`, height: `${settings.height}mm`, fontSize: `${settings.fontSize}pt` }} aria-label={`Kartu ujian ${participant.name}`}>
      <div className="exam-card-content">
        <header className="exam-card-head">
          <div><CardImage blob={assets.logoLeft} label="Logo kiri" /></div>
          <div><strong>{settings.institution || 'Nama Sekolah/Madrasah'}</strong><br />
            {settings.exam || 'Kartu Peserta Ujian'}<br />
            {settings.year && <>{settings.year}<br /></>}{settings.address}</div>
          <div><CardImage blob={assets.logoRight} label="Logo kanan" /></div>
        </header>
        <div className="exam-card-body">
          <div className="min-w-0">
            <dl style={{ textAlign: settings.align }}>
              {fields.map((field) => <div key={field}><dt>{labels[field]}</dt><dd>{participant.values[field] || '—'}</dd></div>)}
            </dl>
            <div className="flex gap-2 items-end mt-1">
              {settings.photo && (photo ? <CardImage blob={photo} label="Foto peserta" /> : <span className="card-photo-empty">Foto</span>)}
              {settings.qr && participant.cardReference && <CardQr reference={participant.cardReference} />}
            </div>
          </div>
          <div className="exam-card-sign">
            <span>{[settings.city, settings.date].filter(Boolean).join(', ')}</span>
            <span>Kepala {settings.institution || 'Sekolah/Madrasah'}</span>
            <CardImage blob={assets.signature} label="Tanda tangan" />
            <strong>{settings.signer || '________________'}</strong>
            {settings.nip && <span>NIP {settings.nip}</span>}
          </div>
        </div>
        {!!schedule.length && <section className="exam-card-schedule"><strong>Jadwal Ujian</strong>
          <ul>{schedule.map((line, index) => <li key={index}>{line}</li>)}</ul>
        </section>}
      </div>
    </article>
    {overflow && <p role="alert">Isi melebihi tinggi kartu. Perbesar kartu, kecilkan teks, atau ringkas jadwal.</p>}
  </div>;
}
