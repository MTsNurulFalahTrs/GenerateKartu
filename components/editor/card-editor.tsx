'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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

export function CardEditor() {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<number | null>(null);
  const [setting, setSetting] = useState(0);
  const [dataset, setDataset] = useState<{ participants: Participant[]; selected: Set<string> }>({ participants: [], selected: new Set() });
  const [photos, setPhotos] = useState(new Map<string, Blob>());
  const [assets, setAssets] = useState<InstitutionAssets>({});
  const [card, setCard] = useState(defaultCard);
  const [custom, setCustom] = useState<Field[]>(['NoPeserta', 'NamaMurid', 'Kelas']);
  const [hidden, setHidden] = useState<Field[]>([]);
  const previewParticipant = dataset.participants.find((participant) => dataset.selected.has(participant.id)) ?? dataset.participants[0] ?? sample;
  function renderCard(participant: Participant, id = format ?? 0): CardRenderModel {
    return { format: id, custom, participant, photo: photos.get(participant.id), settings: card, assets, hidden };
  }
  const [dark, setDark] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Kartu Ujian Pro, editor">
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
                  <span aria-hidden="true">{index + 1}</span>{label}
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
      <main className="content">
        {steps.map((label, index) => (
          <section key={label} id={`panel-${index}`} role="tabpanel" aria-labelledby={`step-${index}`}
            tabIndex={0} hidden={step !== index}>
            <h1>{index === 0 ? 'Pilih Format Kartu' : index === 2 ? 'Pengaturan Kartu' : label}</h1>
            {index === 0 && (
              <div className="format-grid">
                {formats.map((name, id) => (
                  <article className="panel format" key={name} data-selected={format === id}>
                    <h2>Format {id + 1}</h2><p>{name}</p>
                    <button className="action" type="button" aria-pressed={format === id}
                      aria-label={`Pilih Format ${id + 1}`} onClick={() => setFormat(id)}>
                      {format === id ? 'Dipilih' : 'Pilih Format'}
                    </button>
                  </article>
                ))}
                <article className="panel format custom" data-selected={format === 7}>
                  <h2>Format Kustom</h2>
                  <p>Susun kolom dan urutan biodata.</p>
                  <button type="button" id="pick-custom-format" className="action" aria-pressed={format === 7} onClick={() => setFormat(7)}>Pilih format kustom</button>
                </article>
              </div>
            )}
            {index === 0 && format === 7 && <div className="panel mt-4">
              <h2>Susun format kustom</h2>
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
              <ParticipantPanel format={format} custom={custom} onDataset={setDataset} onPhotos={setPhotos} />
            )}
            {index === 2 && (
              <div className="panel">
                <div className="subtabs" role="group" aria-label="Bagian pengaturan">
                  {settings.map((name, id) => (
                    <button className="action" id={`card-settings-${id}`} key={name} type="button" aria-pressed={setting === id} onClick={() => setSetting(id)}>{name}</button>
                  ))}
                </div>
                <h2 className="mb-3">{settings[setting]}</h2>
                <CardSettingsPanel section={setting} value={card} onChange={setCard} assets={assets}
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
              </div>
            )}
            {index === 3 && (
              <div className="panel min-w-0">
                <h2>Pratinjau Kartu</h2>
                {format === null ? <p>Pilih format kartu untuk membuka pratinjau.</p> : <>
                  <p>Format terpilih: {formats[format] ?? 'Format Kustom'}.</p>
                  {dataset.participants.length
                    ? <PreviewPanel key={format} active={step === 3} participants={dataset.participants} selected={dataset.selected} renderCard={renderCard} />
                    : <><p>Contoh kartu. Impor data untuk melihat kartu peserta.</p>{step === 3 && <CardPreview {...renderCard(sample)} />}</>}
                </>}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
