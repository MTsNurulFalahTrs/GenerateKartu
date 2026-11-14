'use client';

import { useEffect, useMemo, useState } from 'react';
import { fieldsFor, photoFieldFor } from '../../lib/participants/model';
import type { Field } from '../../lib/participants/model';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { kopFields, validCardLayout } from '../../lib/cards/settings';
import type { CardSettings } from '../../lib/cards/settings';
import { qrPath } from '../../lib/cards/qr';

const labels: Record<Field, string> = {
  NamaMurid: 'Nama', NoPeserta: 'No. Peserta', NISN: 'NISN', Kelas: 'Kelas',
  Ruang: 'Ruang', Sesi: 'Sesi', Username: 'Username', Password: 'Password', TglLahir: 'Tgl. Lahir', NamaSatdik: 'Satdik',
  Custom1: 'Kolom 1', Custom2: 'Kolom 2', Custom3: 'Kolom 3',
  Custom4: 'Kolom 4', Custom5: 'Kolom 5', Custom6: 'Kolom 6',
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

export function KopText({ settings }: { settings: CardSettings }) {
  return <div>{kopFields.map((field) => {
    const text = settings[field] || (field === 'institution' ? 'Nama Sekolah/Madrasah' : field === 'exam' ? 'Kartu Peserta Ujian' : '');
    const style = settings.kopStyles[field];
    return text && <div key={field} style={{ fontSize: `${style.size}px`, fontWeight: style.bold ? 700 : 400,
      fontStyle: style.italic ? 'italic' : 'normal' }}>{text}</div>;
  })}</div>;
}

function CardQr({ reference }: { reference: string }) {
  const qr = useMemo(() => qrPath(reference), [reference]);
  return <svg aria-label="QR referensi kartu" role="img" viewBox={`0 0 ${qr.size} ${qr.size}`} className="card-qr" shapeRendering="crispEdges">
    <rect width={qr.size} height={qr.size} fill="#fff" /><path d={qr.path} fill="#000" />
  </svg>;
}

export function CardPreview({ format, custom, customAppearance, participant, photo, settings, assets, hidden, output = false }: CardRenderModel & { output?: boolean }) {
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

  if (!validCardLayout(settings)) return <p role="alert">Gunakan lebar 60–180 mm, tinggi 40–150 mm, dan teks 6–12 pt.</p>;
  const fields = fieldsFor(format, custom).filter((field) => field === 'NamaMurid' || field === photoFieldFor(format, customAppearance?.photoKey) || !hidden.includes(field));
  const scheduleTable = settings.showSchedule ? settings.scheduleTable : null;
  const schedule = settings.showSchedule ? settings.schedule.split('\n').map((line) => line.trim()).filter(Boolean) : [];
  return <div className="card-preview-wrap">
    <article ref={output ? undefined : setElement} className="exam-card" data-bw={settings.monochrome}
      style={{ width: `${settings.width}mm`, height: `${settings.height}mm`, fontSize: `${settings.fontSize}pt` }} aria-label={`Kartu ujian ${participant.name}`}>
      <div className="exam-card-content">
        <header className="exam-card-head">
          <div><CardImage blob={assets.logoLeft} label="Logo kiri" /></div>
          <KopText settings={settings} />
          <div><CardImage blob={assets.logoRight} label="Logo kanan" /></div>
        </header>
        <div className="exam-card-body" data-schedule={!!scheduleTable || schedule.length > 0}>
          <div className="min-w-0">
            <dl style={{ textAlign: settings.align }}>
              {fields.map((field) => <div key={field}><dt>{format === 7 ? customAppearance?.labels?.[field] || labels[field] : labels[field]}</dt><dd className={format === 7 && customAppearance?.mono.includes(field) ? "font-mono" : undefined}>{participant.values[field] || '—'}</dd></div>)}
            </dl>
            <div className="flex gap-2 items-end mt-1">
              {settings.photo && (photo ? <CardImage blob={photo} label="Foto peserta" /> : <span className="card-photo-empty">Foto</span>)}
              {settings.qr && participant.cardReference && <CardQr reference={participant.cardReference} />}
            </div>
          </div>
          <div className="exam-card-sign" data-overlap={settings.signatureOverlap && !!assets.signature} data-signature={!!assets.signature}>
            <span>{[settings.city, settings.date || new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date())].filter(Boolean).join(', ')}</span>
            <span>Kepala {settings.institution || 'Sekolah/Madrasah'}</span>
            {assets.signature && <div className="exam-card-signature" style={{ height: `${settings.signatureSize}cm` }}>
              <CardImage blob={assets.signature} label="Tanda tangan" />
            </div>}
            <strong className="exam-card-signer">{settings.signer || '________________'}</strong>
            {settings.nip && <span>NIP {settings.nip}</span>}
          </div>
          {scheduleTable ? <section className="exam-card-schedule"><strong>Jadwal Ujian</strong>
            <table><thead><tr>{scheduleTable.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
              <tbody>{Array.from({ length: scheduleTable.rowCount }, (_, row) => <tr key={row}>
                {scheduleTable.columns.map((column, index) => <td key={column}>{scheduleTable.rows[row]?.[index] || '\u00a0'}</td>)}
              </tr>)}</tbody>
            </table>
          </section> : !!schedule.length && <section className="exam-card-schedule"><strong>Jadwal Ujian</strong>
            <ul>{schedule.map((line, index) => <li key={index}>{line}</li>)}</ul>
          </section>}
        </div>
      </div>
    </article>
    {overflow && <p role="alert">Isi melebihi tinggi kartu. Perbesar kartu, kecilkan teks, atau ringkas jadwal.</p>}
  </div>;
}
