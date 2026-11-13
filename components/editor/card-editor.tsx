'use client';

import Link from 'next/link';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { BackupPanel } from './backup-panel';
import { defaultCustom, idleLimit, parseBackup, pickHeading, pickOptions, storageKey } from '../../lib/cards/preferences';
import type { Heading, Preferences } from '../../lib/cards/preferences';
import { CardSettingsPanel } from './card-settings';
import { PreviewPanel } from './preview-panel';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { CardPreview } from './card-preview';
import { defaultCard } from '../../lib/cards/settings';
import type { InstitutionAssets } from '../../lib/cards/settings';
import { fieldsFor } from '../../lib/participants/model';
import type { Field, Participant } from '../../lib/participants/model';
import { ParticipantPanel } from './participant-panel';
import { formats, moveStep, steps } from '../../lib/editor';

const settings = ['Kop', 'Tata Letak', 'Jadwal'] as const;
const sample: Participant = {
  id: 'CONTOH-001',
  cardReference: 'GK1:00000000000000000000000000000000',
  name: 'Peserta Contoh',
  values: { NamaMurid: 'Peserta Contoh', NoPeserta: '0001', NISN: '0000000001', Kelas: 'IX-A', Ruang: '1', Sesi: 'Sesi 1', Username: 'CONTOH-001', TglLahir: '2012-01-01', NamaSatdik: 'Madrasah Contoh' },
};
const optionalFields = ['NISN', 'Kelas', 'Ruang', 'Sesi', 'Username', 'TglLahir', 'NamaSatdik'] as const;

const formatFieldLabels: Record<Field, string> = {
  NamaMurid: 'Nama Murid', NoPeserta: 'No. Peserta', NISN: 'NISN', Kelas: 'Kelas',
  Ruang: 'Ruang', Sesi: 'Sesi', Username: 'Username', TglLahir: 'Tgl. Lahir', NamaSatdik: 'Nama Satdik',
};

const formatTitles = [...formats.map((_, id) => `Format ${id + 1}`), 'Format Kustom'];
const formatIcons = ['▣', '♙', '▢', '▤', '♙', '▥', '⌂', '✎'];

export function CardEditor() {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<number | null>(0);
  const [formatQuery, setFormatQuery] = useState('');
  const [previewFormat, setPreviewFormat] = useState<number | null>(null);
  const [editingCustom, setEditingCustom] = useState(false);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const customBuilder = useRef<HTMLHeadingElement>(null);
  const [setting, setSetting] = useState(0);
  const [dataset, setDataset] = useState<{ participants: Participant[]; selected: Set<string> }>({ participants: [], selected: new Set() });
  const [photos, setPhotos] = useState(new Map<string, Blob>());
  const [assets, setAssets] = useState<InstitutionAssets>({});
  const [card, setCard] = useState(defaultCard);
  const [custom, setCustom] = useState<Field[]>(defaultCustom);
  const [hidden, setHidden] = useState<Field[]>([]);
  const previewParticipant = dataset.participants.find((participant) => dataset.selected.has(participant.id)) ?? dataset.participants[0] ?? sample;
  function renderCard(participant: Participant, id = format ?? 0): CardRenderModel {
    return { format: id, custom, participant, photo: photos.get(participant.id), settings: card, assets, hidden };
  }
  const [dark, setDark] = useState(false);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [storageMessage, setStorageMessage] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const options = pickOptions(card);
  const preferences: Preferences = { schemaVersion: 1, dark, format, custom, hidden, settings: options };
  const serialized = JSON.stringify(preferences);
  const heading = useMemo(() => pickHeading(card), [card]);

  const restore = useCallback((saved: Preferences, savedHeading?: Heading) => {
    setDark(saved.dark);
    setFormat(saved.format ?? 0);
    setCustom(saved.custom);
    setHidden(saved.hidden);
    setCard((previous) => ({ ...previous, ...saved.settings, ...savedHeading }));
  }, []);

  const clearSession = useCallback(() => {
    setDataset({ participants: [], selected: new Set() });
    setPhotos(new Map());
    setAssets({});
    setCard((previous) => ({ ...defaultCard, ...pickOptions(previous) }));
    setRevision((previous) => previous + 1);
  }, []);

  function reset() {
    clearSession();
    restore({ schemaVersion: 1, dark: false, format: 0, custom: defaultCustom, hidden: [], settings: pickOptions(defaultCard) });
    setSessionMessage('Sesi dan pengaturan telah direset.');
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setStorageMessage('Penyimpanan browser tidak tersedia. Pengaturan hanya berlaku untuk tab ini.');
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) restore(parseBackup(saved, false).preferences);
      } catch {
        setStorageMessage('Preferensi tersimpan tidak dapat dibaca. Pengaturan bawaan digunakan.');
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [restore]);

  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => {
      try {
        parseBackup(serialized, false);
      } catch {
        return; // An incomplete numeric edit should not replace the last valid settings.
      }
      try {
        localStorage.setItem(storageKey, serialized);
      } catch {
        setStorageMessage('Penyimpanan browser penuh atau diblokir. Pengaturan hanya berlaku untuk tab ini.');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, serialized]);

  useEffect(() => {
    let lastActive = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      const remaining = idleLimit - (Date.now() - lastActive);
      if (remaining <= 0) {
        clearSession();
        setSessionMessage('Sesi kedaluwarsa. Data peserta dan aset sesi telah dibersihkan.');
        lastActive = Date.now();
      }
      clearTimeout(timer);
      timer = setTimeout(check, Math.max(1, idleLimit - (Date.now() - lastActive)));
    };
    const activity = () => {
      if (Date.now() - lastActive >= idleLimit) check();
      lastActive = Date.now();
    };
    const conceal = () => document.documentElement.setAttribute('data-card-session-paused', '');
    const resume = () => {
      flushSync(check);
      requestAnimationFrame(() => document.documentElement.removeAttribute('data-card-session-paused'));
    };
    const visibility = () => {
      if (document.hidden) conceal();
      else resume();
    };
    timer = setTimeout(check, idleLimit);
    const events = ['pointerdown', 'keydown', 'input', 'wheel'] as const;
    events.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', conceal);
    window.addEventListener('pageshow', resume);
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, activity));
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', conceal);
      window.removeEventListener('pageshow', resume);
      document.documentElement.removeAttribute('data-card-session-paused');
    };
  }, [clearSession]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (previewFormat !== null) previewDialog.current?.showModal();
  }, [previewFormat]);

  useEffect(() => {
    if (editingCustom && step === 0) customBuilder.current?.focus();
  }, [editingCustom, step]);

  const completedSteps = [format !== null, dataset.participants.length > 0];
  const visibleFormats = formatTitles.map((title, id) => ({ title, id })).filter(({ title, id }) =>
    `${title} ${formats[id] ?? 'Buat Sendiri'}`.toLowerCase().includes(formatQuery.trim().toLowerCase()));

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = moveStep(index, event.key);
    setStep(next);
    tabRefs.current[next]?.focus({ preventScroll: true });
    tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  return (
    <div className="editor" data-theme={dark ? 'dark' : 'light'}>
      <a className="skip-editor" href="#editor-content">Lewati ke isi editor</a>
      <header className="header" data-step={step}>
        <div className="header-inner">
          <Link className="brand" href="/">
            <span className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 9 12 3l11 6-11 6-11-6Zm4 4 7 4 7-4v5l-7 4-7-4Z"/></svg>
            </span>
            <span><strong>Kartu Ujian Pro</strong><small>Generator Kartu Peserta</small></span>
          </Link>
          <div className="navigation">
            <div className="stepper" role="tablist" aria-label="Langkah pembuatan kartu">
              {steps.map((label, index) => (
                <button key={label} id={`step-${index}`} role="tab" type="button"
                  aria-selected={step === index} aria-controls={`panel-${index}`}
                  tabIndex={step === index ? 0 : -1}
                  ref={(element) => { tabRefs.current[index] = element; }}
                  onKeyDown={(event) => onTabKey(event, index)}
                  onClick={() => setStep(index)}>
                  <span data-complete={!!completedSteps[index]} aria-hidden="true">{completedSteps[index] ? '✓' : index + 1}</span>{label}
                </button>
              ))}
            </div>
            <Link href="/bantuan">Bantuan</Link>
            <button type="button" className="theme" aria-label="Tema gelap" aria-pressed={dark} onClick={() => setDark(!dark)}>
              <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="content" id="editor-content" tabIndex={-1}>
        {sessionMessage && <p role="status">{sessionMessage}</p>}
        {steps.map((label, index) => (
          <section key={label} id={`panel-${index}`} role="tabpanel" aria-labelledby={`step-${index}`}
            tabIndex={0} hidden={step !== index}>
            <h1 className={index === 0 ? 'sr-only' : undefined}>{index === 0 ? 'Pilih Format Kartu' : index === 2 ? 'Pengaturan Kartu' : label}</h1>
            {index === 0 && (
              <>
                <p>Pilih tata letak yang sesuai standar ujian madrasah atau sekolah Anda.</p>
                {format !== null && <div className="format-summary" role="status">
                  <span className="format-icon" aria-hidden="true">✓</span>
                  <div><small>Format Aktif</small><strong>{formatTitles[format]}{formats[format] && ` (${formats[format]})`}</strong></div>
                  <span className="format-count">{fieldsFor(format, custom).length} field</span>
                </div>}
                <div className="format-toolbar">
                  <input type="search" aria-label="Cari format" placeholder="Cari format..." value={formatQuery}
                    onChange={(event) => setFormatQuery(event.target.value)} />
                  <span className="format-count">Bawaan {formatTitles.length}</span>
                </div>
                {visibleFormats.length === 0 && <p role="status">Tidak ada format yang cocok.</p>}
                <div className="format-grid">
                  {visibleFormats.map(({ title, id }) => {
                    const fields = fieldsFor(id, custom);
                    const photoKey = id === 0 ? 'Username' : 'NoPeserta';
                    return <article className={id === 7 ? 'format custom' : 'format'} key={id} data-selected={format === id}>
                      <header className="format-heading">
                        <span className="format-icon" aria-hidden="true">{formatIcons[id]}</span>
                        <div><h2>{title}</h2><span>{formats[id] ?? 'Buat Sendiri'}</span></div>
                        <span className="format-count">{fields.length} field</span>
                      </header>
                      <ul className="format-fields">
                        {fields.map((field) => <li key={field}>
                          <span className="format-check" aria-hidden="true">✓</span>
                          <span>{formatFieldLabels[field]}</span>
                          {field === photoKey && <span className="format-photo">Acuan Foto</span>}
                        </li>)}
                      </ul>
                      <div className="format-actions">
                        <button type="button" className="action format-pick" aria-pressed={format === id}
                          id={id === 7 ? 'pick-custom-format' : `pick-format-${id + 1}`}
                          aria-label={format === id ? `Format Aktif · ${title}` : `Pilih ${title}`}
                          onClick={() => setFormat(id)}>{format === id ? 'Format Aktif' : 'Pilih Format'}</button>
                        <button type="button" className="action" aria-haspopup="dialog" aria-label={`Preview ${title}`}
                          onClick={(event) => {
                            previewTrigger.current = event.currentTarget;
                            setPreviewFormat(id);
                          }}>Preview</button>
                        {id === 7 && <button type="button" className="action" onClick={() => {
                          if (editingCustom) customBuilder.current?.focus();
                          else setEditingCustom(true);
                        }}>Atur</button>}
                      </div>
                    </article>;
                  })}
                </div>
              </>
            )}
            {index === 0 && (format === 7 || editingCustom) && <div className="panel mt-4">
              <h2 ref={customBuilder} tabIndex={-1}>Susun format kustom</h2>
              <p>Nomor peserta dan nama wajib. Kolom lain dapat ditambahkan atau diurutkan.</p>
              <div className="flex flex-wrap gap-3">{optionalFields.map((field) => <label key={field}>
                <input type="checkbox" checked={custom.includes(field)} onChange={(event) => {
                  setCustom(event.target.checked ? [...custom, field] : custom.filter((item) => item !== field));
                }} /> {field}
              </label>)}</div>
              <ol className="mt-3 grid gap-2">{custom.map((field, position) => <li key={field} className="flex items-center gap-2">
                <span>{position + 1}. {field}</span>
                <button className="action" type="button" aria-label={`Naikkan ${field}`} disabled={position === 0} onClick={() => {
                  const next = [...custom];
                  [next[position - 1], next[position]] = [next[position], next[position - 1]];
                  setCustom(next);
                }}>↑</button>
              </li>)}</ol>
            </div>}
            {index === 1 && (
              <ParticipantPanel key={revision} format={format} custom={custom} onDataset={setDataset} onPhotos={setPhotos} />
            )}
            {index === 2 && (
              <div className="panel">
                <div className="subtabs" role="group" aria-label="Bagian pengaturan">
                  {settings.map((name, id) => (
                    <button className="action" id={`card-settings-${id}`} key={name} type="button" aria-pressed={setting === id} onClick={() => setSetting(id)}>{name}</button>
                  ))}
                </div>
                <h2 className="mb-3">{settings[setting]}</h2>
                <CardSettingsPanel key={revision} section={setting} value={card} onChange={setCard} assets={assets}
                  onAssets={(name, asset) => setAssets((previous) => ({ ...previous, [name]: asset }))} />
                {setting === 1 && format !== null && <fieldset className="mt-4">
                  <legend>Kolom kartu</legend>
                  <div className="flex flex-wrap gap-3">{fieldsFor(format, custom).filter((field) =>
                    field !== 'NamaMurid' && field !== (format === 0 ? 'Username' : 'NoPeserta')).map((field) =>
                    <label key={field}><input type="checkbox" checked={!hidden.includes(field)} onChange={(event) =>
                      setHidden(event.target.checked ? hidden.filter((item) => item !== field) : [...hidden, field])
                    } /> {field}</label>)}</div>
                </fieldset>}
                <div className="mt-4">{step === 2 && <CardPreview {...renderCard(previewParticipant)} />}</div>
                <BackupPanel key={revision} preferences={preferences} heading={heading}
                  onRestore={restore} onReset={reset} storageMessage={storageMessage} />
              </div>
            )}
            {index === 3 && (
              <div className="panel min-w-0">
                <h2>Pratinjau Kartu</h2>
                {format === null ? <p>Pilih format kartu untuk membuka pratinjau.</p> : <>
                  <p>Format terpilih: {formats[format] ?? 'Format Kustom'}.</p>
                  {dataset.participants.length
                    ? <PreviewPanel key={`${format}:${revision}`} active={step === 3} participants={dataset.participants} selected={dataset.selected} renderCard={renderCard} />
                    : <><p>Contoh kartu. Impor data untuk melihat kartu peserta.</p>{step === 3 && <CardPreview {...renderCard(sample)} />}</>}
                </>}
              </div>
            )}
          </section>
        ))}
      </main>
      <dialog className="format-dialog" ref={previewDialog} aria-labelledby="format-preview-title" onClose={() => {
        setPreviewFormat(null);
        previewTrigger.current?.focus();
      }}>
        {previewFormat !== null && <>
          <header>
            <span className="format-icon" aria-hidden="true">◉</span>
            <h2 id="format-preview-title">Preview: {formatTitles[previewFormat]}</h2>
            <button type="button" className="action" aria-label="Tutup modal Preview"
              onClick={() => previewDialog.current?.close()}>×</button>
          </header>
          <div className="format-preview-stage">
            <CardPreview {...renderCard(sample, previewFormat)} photo={undefined}
              hidden={previewFormat === format ? hidden : []} />
          </div>
          <footer>
            <p>Jika isi kartu terpotong, sesuaikan ukuran kartu di <strong>Pengaturan → Tata Letak</strong>.</p>
            <button type="button" className="action format-close" onClick={() => previewDialog.current?.close()}>Tutup Preview</button>
          </footer>
        </>}
      </dialog>
    </div>
  );
}
