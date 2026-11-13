'use client';

import { HelpContent } from './help-content';
import { AppBrand, PageHeading } from './page-chrome';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CustomFormatDialog } from './custom-format-dialog';
import { BackupPanel } from './backup-panel';
import { defaultCustom, idleLimit, parseBackup, pickHeading, pickOptions, storageKey } from '../../lib/cards/preferences';
import type { CustomAppearance, Heading, Preferences } from '../../lib/cards/preferences';
import { CardSettingsPanel } from './card-settings';
import { PreviewPanel } from './preview-panel';
import type { CardRenderModel } from '../../lib/cards/render-model';
import { CardOutput } from './card-output';
import { CardPreview } from './card-preview';
import { defaultCard, validCardLayout } from '../../lib/cards/settings';
import type { InstitutionAssets } from '../../lib/cards/settings';
import { fieldsFor, photoFieldFor } from '../../lib/participants/model';
import type { Field, Participant } from '../../lib/participants/model';
import { EditorIcon } from './editor-icon';
import { ParticipantPanel } from './participant-panel';
import { formats, moveStep, steps } from '../../lib/editor';

const settings = ['KOP & Identitas', 'Layout & Cetak', 'Tabel Jadwal'] as const;
const sample: Participant = {
  id: 'CONTOH-001',
  cardReference: 'GK1:00000000000000000000000000000000',
  name: 'Peserta Contoh',
  values: { NamaMurid: 'Peserta Contoh', NoPeserta: '0001', NISN: '0000000001', Kelas: 'IX-A', Ruang: '1', Sesi: 'Sesi 1', Username: 'CONTOH-001', TglLahir: '2012-01-01', NamaSatdik: 'Madrasah Contoh' },
};
const formatFieldLabels: Record<Field, string> = {
  NamaMurid: 'Nama Murid', NoPeserta: 'No. Peserta', NISN: 'NISN', Kelas: 'Kelas',
  Ruang: 'Ruang', Sesi: 'Sesi', Username: 'Username', TglLahir: 'Tgl. Lahir', NamaSatdik: 'Nama Satdik',
  Custom1: 'Kolom Kustom 1', Custom2: 'Kolom Kustom 2', Custom3: 'Kolom Kustom 3',
  Custom4: 'Kolom Kustom 4', Custom5: 'Kolom Kustom 5', Custom6: 'Kolom Kustom 6',
};

const pageHeadings = [
  { title: 'Pilih Format Kartu', description: 'Pilih tata letak yang sesuai standar ujian madrasah atau sekolah Anda.' },
  { title: 'Unggah Data & Foto', description: 'Semua data murid dan foto diproses di browser Anda.' },
  { title: 'Pengaturan Kartu', description: 'Atur KOP kartu ujian, logo, data penandatangan, dan ukuran fisik kartu.' },
  { title: 'Pratinjau & Cetak', description: 'Periksa tampilan kartu sebelum mencetak ke kertas.' },
] as const;

const formatTitles = [...formats.map((_, id) => `Format ${id + 1}`), 'Format Kustom'];
const formatIcons = ['monitor', 'users', 'clipboard', 'calendar', 'user', 'building', 'home', 'edit'] as const;

export function CardEditor() {
  const [step, setStep] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [format, setFormat] = useState<number | null>(0);
  const [formatQuery, setFormatQuery] = useState('');
  const [previewFormat, setPreviewFormat] = useState<number | null>(null);
  const [editingCustom, setEditingCustom] = useState(false);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const customTrigger = useRef<HTMLButtonElement>(null);
  const [setting, setSetting] = useState(0);
  const [dataset, setDataset] = useState<{ participants: Participant[]; selected: Set<string> }>({ participants: [], selected: new Set() });
  const [photos, setPhotos] = useState(new Map<string, Blob>());
  const [assets, setAssets] = useState<InstitutionAssets>({});
  const [card, setCard] = useState(defaultCard);
  const [custom, setCustom] = useState<Field[]>(defaultCustom);
  const [customAppearance, setCustomAppearance] = useState<CustomAppearance>();
  const [customConfigured, setCustomConfigured] = useState(false);
  const [hidden, setHidden] = useState<Field[]>([]);
  const previewParticipant = dataset.participants.find((participant) => dataset.selected.has(participant.id)) ?? dataset.participants[0] ?? sample;
  function renderCard(participant: Participant, id = format ?? 0): CardRenderModel {
    return { format: id, custom, customAppearance, participant, photo: photos.get(participant.id), settings: card, assets, hidden };
  }
  const [dark, setDark] = useState(false);
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [savedSettings, setSavedSettings] = useState<{ snapshot: string; assets: InstitutionAssets }>();
  const [storageMessage, setStorageMessage] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const options = pickOptions(card);
  const preferences: Preferences = { schemaVersion: 1, dark, format, custom, customAppearance, hidden, settings: options };
  const serialized = JSON.stringify(preferences);
  const heading = useMemo(() => pickHeading(card), [card]);
  const settingsSnapshot = JSON.stringify({ serialized, card });

  function saveSettings() {
    try {
      parseBackup(serialized, false);
      localStorage.setItem(storageKey, serialized);
      setSavedSettings({ snapshot: settingsSnapshot, assets });
      setStorageMessage('');
    } catch {
      setStorageMessage('Pengaturan belum tersimpan di browser. Periksa nilai pengaturan dan ketersediaan penyimpanan.');
    }
  }

  const restore = useCallback((saved: Preferences, savedHeading?: Heading) => {
    setDark(saved.dark);
    setFormat(saved.format ?? 0);
    setCustom(saved.custom);
    setCustomAppearance(saved.customAppearance);
    setCustomConfigured(!!saved.customAppearance || saved.format === 7 || saved.custom.join() !== defaultCustom.join());
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
    setSavedSettings(undefined);
    restore({ schemaVersion: 1, dark: false, format: 0, custom: defaultCustom, hidden: [], settings: pickOptions(defaultCard) });
    setSetting(0);
    setStorageMessage('');
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

  const titles = formatTitles.map((title, id) => id === 7 ? customAppearance?.name ?? title : title);
  function openCustom(trigger: HTMLButtonElement) {
    customTrigger.current = trigger;
    setEditingCustom(true);
  }

  const completedSteps = [format !== null, dataset.participants.length > 0];
  const visibleFormats = titles.map((title, id) => ({ title, id })).filter(({ title, id }) =>
    `${title} ${formats[id] ?? 'Buat Sendiri'}`.toLowerCase().includes(formatQuery.trim().toLowerCase()));

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = moveStep(index, event.key);
    setHelpOpen(false);
    setStep(next);
    tabRefs.current[next]?.focus({ preventScroll: true });
    tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  return (
    <div className="editor" data-theme={dark ? 'dark' : 'light'}>
      <a className="skip-editor" href="#editor-content">Lewati ke isi editor</a>
      <header className="header" data-step={step}>
        <div className="header-inner">
          <AppBrand />
          <div className="navigation">
            <div className="stepper" role="tablist" aria-label="Langkah pembuatan kartu">
              {steps.map((label, index) => (
                <button key={label} id={`step-${index}`} role="tab" type="button"
                  aria-selected={!helpOpen && step === index} aria-controls={`panel-${index}`}
                  tabIndex={step === index ? 0 : -1}
                  ref={(element) => { tabRefs.current[index] = element; }}
                  onKeyDown={(event) => onTabKey(event, index)}
                  onClick={() => { setHelpOpen(false); setStep(index); }}>
                  <span data-complete={!!completedSteps[index]} aria-hidden="true">{completedSteps[index] ? '✓' : index + 1}</span>{label}
                </button>
              ))}
            </div>
            <button className="action help-nav" type="button" aria-pressed={helpOpen} aria-controls="editor-help-panel" onClick={() => setHelpOpen(!helpOpen)}>Bantuan</button>
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
            tabIndex={0} hidden={helpOpen || step !== index}>
            <PageHeading title={pageHeadings[index].title} description={pageHeadings[index].description}
              badges={<><span>Langkah {index + 1} dari {steps.length}</span>
                {index === 1 && <span>Data lokal</span>}
                {index === 3 && <span>{dataset.selected.size} kartu terpilih</span>}
              </>}
              actions={index === 2 && <>
                <button className="action" id="reset-card-session" type="button" onClick={() => {
                  if (window.confirm('Reset pengaturan dan hapus data peserta, foto, serta aset dari sesi ini?')) reset();
                }}>Reset</button>
                <span className="format-count" role="status">{savedSettings?.snapshot === settingsSnapshot && savedSettings.assets === assets ? 'Disimpan' : 'Belum disimpan'}</span>
              </>}
            />
            {index === 0 && (
              <>
                {format !== null && <div className="format-summary" role="status">
                  <span className="format-icon" aria-hidden="true">✓</span>
                  <div><small>Format Aktif</small><strong>{titles[format]}{formats[format] && ` (${formats[format]})`}</strong></div>
                  <span className="format-count">{fieldsFor(format, custom).length} field</span>
                </div>}
                <div className="format-toolbar"><EditorIcon name="search" />
                  <input type="search" aria-label="Cari format" placeholder="Cari format..." value={formatQuery}
                    onChange={(event) => setFormatQuery(event.target.value)} />
                  <span className="format-count">Bawaan {formatTitles.length}</span>
                </div>
                {visibleFormats.length === 0 && <p role="status">Tidak ada format yang cocok.</p>}
                <div className="format-grid">
                  {visibleFormats.map(({ title, id }) => {
                    const fields = fieldsFor(id, custom);
                    const photoKey = photoFieldFor(id, customAppearance?.photoKey);
                    const unconfigured = id === 7 && !customConfigured;
                    return <article className={id === 7 ? 'format custom' : 'format'} key={id} data-format={id + 1} data-selected={format === id}>
                      <header className="format-heading">
                        <span className="format-icon" aria-hidden="true"><EditorIcon name={formatIcons[id]} /></span>
                        <div><h2>{title}</h2><span>{formats[id] ?? 'Buat Sendiri'}</span></div>
                        {!unconfigured && <span className="format-count">{fields.length} field</span>}
                      </header>
                      <ul className="format-fields">
                        {unconfigured && <li className="custom-format-placeholder">Belum dikonfigurasi. Klik “Atur” untuk membuat format Anda sendiri.</li>}
                        {!unconfigured && fields.map((field) => <li key={field}>
                          <span className="format-check" aria-hidden="true">✓</span>
                          <span>{id === 7 ? customAppearance?.labels?.[field] || formatFieldLabels[field] : formatFieldLabels[field]}</span>
                          {field === photoKey && <span className="format-photo"><EditorIcon name="image" /> Acuan Foto</span>}
                        </li>)}
                      </ul>
                      <div className="format-actions">
                        <button type="button" className="action format-pick" aria-pressed={format === id}
                          id={id === 7 ? 'pick-custom-format' : `pick-format-${id + 1}`}
                          aria-label={format === id ? `Format Aktif · ${title}` : `Pilih ${title}`}
                          onClick={(event) => unconfigured ? openCustom(event.currentTarget) : setFormat(id)}>{format === id ? 'Format Aktif' : 'Pilih Format'}</button>
                        {!unconfigured && <button type="button" className="action" aria-haspopup="dialog" aria-label={`Preview ${title}`}
                          onClick={(event) => {
                            previewTrigger.current = event.currentTarget;
                            setPreviewFormat(id);
                          }}><EditorIcon name="eye" /> Preview</button>}
                        {id === 7 && <button type="button" className="action" aria-haspopup="dialog" onClick={(event) => openCustom(event.currentTarget)}>
                          <EditorIcon name="edit" /> Atur</button>}
                      </div>
                    </article>;
                  })}
                </div>
              </>
            )}
            {index === 1 && (
              <>
                <ParticipantPanel key={revision} active={!helpOpen && step === 1} format={format} custom={custom} customPhotoKey={customAppearance?.photoKey} customAppearance={customAppearance} photos={photos} onDataset={setDataset} onPhotos={setPhotos} />
                <footer className="page-footer">
                  <small>Tip: Foto bersifat opsional. Kartu tetap bisa dicetak tanpa foto.</small>
                  <button className="action" type="button" onClick={() => setStep(0)}>‹ Kembali</button>
                  <button className="action data-next" type="button" onClick={() => setStep(2)}>Lanjut ke Pengaturan ›</button>
                </footer>
              </>
            )}
            {index === 2 && (
              <>
              <div className="panel kop-shell">
                <div className="subtabs" role="group" aria-label="Bagian pengaturan">
                  {settings.map((name, id) => (
                    <button className="action" id={`card-settings-${id}`} key={name} type="button" aria-pressed={setting === id} onClick={() => setSetting(id)}>{name}</button>
                  ))}
                </div>
                <CardSettingsPanel key={`settings-${revision}`} section={setting} value={card} onChange={setCard} assets={assets}
                  onAssets={(name, asset) => setAssets((previous) => ({ ...previous, [name]: asset }))} />
                {setting === 1 && <details className="layout-extra layout-card-preview">
                  <summary>Kolom kartu &amp; pratinjau</summary>
                  {format !== null && <fieldset className="mt-4">
                    <legend>Kolom kartu</legend>
                    <div className="flex flex-wrap gap-3">{fieldsFor(format, custom).filter((field) =>
                      field !== 'NamaMurid' && field !== photoFieldFor(format, customAppearance?.photoKey)).map((field) =>
                      <label key={field}><input type="checkbox" checked={!hidden.includes(field)} onChange={(event) =>
                        setHidden(event.target.checked ? hidden.filter((item) => item !== field) : [...hidden, field])
                      } /> {field}</label>)}</div>
                  </fieldset>}
                  {format !== null && <div className="layout-card-preview-stage"><CardPreview {...renderCard(previewParticipant)} /></div>}
                </details>}
                {setting === 2 && <details className="print-extra"><summary>Pratinjau kartu</summary><CardPreview {...renderCard(previewParticipant)} /></details>}
                <button className="action kop-save" type="button" onClick={saveSettings}>Simpan Pengaturan</button>
                <small className="kop-save-note">Preferensi disimpan di browser. Isi KOP dan aset berlaku selama sesi.</small>
                <BackupPanel key={`backup-${revision}`} preferences={preferences} heading={heading}
                  onRestore={restore} storageMessage={storageMessage} compact={setting !== 0} />
              </div>
              <footer className="page-footer">
                <button className="action" type="button" onClick={() => setStep(1)}>‹ Kembali</button>
                <button className="action data-next" type="button" disabled={!validCardLayout(card)} onClick={() => setStep(3)}>Lihat & Cetak Kartu ›</button>
              </footer>
              </>
            )}
            {index === 3 && (
              <div className="print-workspace min-w-0">
                {format === null ? <p>Pilih format kartu untuk membuka pratinjau.</p> : <>
                  <p className="sr-only">Format terpilih: {formats[format] ?? 'Format Kustom'}.</p>
                  {dataset.participants.length
                    ? <PreviewPanel key={`${format}:${revision}`} active={!helpOpen && step === 3} participants={dataset.participants} selected={dataset.selected} renderCard={renderCard} />
                    : <><CardOutput participants={dataset.participants} renderCard={renderCard} pending={false} /><p>Contoh kartu. Impor data untuk melihat kartu peserta.</p>{step === 3 && <CardPreview {...renderCard(sample)} />}</>}
                </>}
              </div>
            )}
          </section>
        ))}
        <section id="editor-help-panel" hidden={!helpOpen}>
          {helpOpen && <HelpContent inEditor participants={dataset.participants.length} photos={photos.size} />}
        </section>
      </main>
      {editingCustom && <CustomFormatDialog fields={customConfigured ? custom : []} appearance={customAppearance} labels={formatFieldLabels}
        onClose={() => {
          setEditingCustom(false);
          const trigger = customTrigger.current;
          requestAnimationFrame(() => {
            if (trigger?.isConnected && trigger.offsetWidth) trigger.focus();
            else document.querySelector<HTMLButtonElement>('#pick-custom-format')?.focus();
          });
        }}
        onSave={(fields, appearance) => {
          setCustom(fields);
          setCustomAppearance(appearance);
          setCustomConfigured(true);
          setHidden([]);
          setFormat(7);
        }} />}
      <dialog className="format-dialog" ref={previewDialog} aria-labelledby="format-preview-title" onClose={() => {
        setPreviewFormat(null);
        previewTrigger.current?.focus();
      }}>
        {previewFormat !== null && <>
          <header>
            <span className="format-icon" aria-hidden="true"><EditorIcon name="eye" /></span>
            <h2 id="format-preview-title">Preview: {titles[previewFormat]}</h2>
            <button type="button" className="action" aria-label="Tutup modal Preview"
              onClick={() => previewDialog.current?.close()}>×</button>
          </header>
          <div className="format-preview-stage">
            <CardPreview {...renderCard(sample, previewFormat)} photo={undefined}
              hidden={previewFormat === format ? hidden : []} />
          </div>
          <footer>
            <p>Jika isi kartu terpotong, sesuaikan ukuran kartu di <strong>Pengaturan → Layout & Cetak</strong>.</p>
            <button type="button" className="action format-close" onClick={() => previewDialog.current?.close()}>Tutup Preview</button>
          </footer>
        </>}
      </dialog>
    </div>
  );
}
