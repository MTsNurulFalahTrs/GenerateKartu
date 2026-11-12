'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { formats, moveStep, steps } from '../../lib/editor';

const settings = ['Kop', 'Tata Letak', 'Jadwal'] as const;
const settingsDescriptions = [
  'Kop, logo, dan tanda tangan akan ditampilkan pada pratinjau kartu.',
  'Ukuran kartu, warna, foto, dan QR diatur di sini.',
  'Atur kolom jadwal yang akan tampil pada kartu.',
];

export function CardEditor() {
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<number | null>(null);
  const [setting, setSetting] = useState(0);
  const [dark, setDark] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = moveStep(index, event.key);
    setStep(next);
    tabRefs.current[next]?.focus();
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
                <article className="panel format custom"><h2>Format Kustom</h2><p>Builder tersedia pada fase pengolahan format.</p></article>
              </div>
            )}
            {index === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="panel"><h2>1. Data Excel</h2><p>Impor XLS dan XLSX tersedia pada fase data peserta.</p></div>
                <div className="panel"><h2>2. Foto Peserta</h2><p>Foto individual dan ZIP tersedia pada fase pengolahan aset.</p></div>
              </div>
            )}
            {index === 2 && (
              <div className="panel">
                <div className="subtabs" role="group" aria-label="Bagian pengaturan">
                  {settings.map((name, id) => (
                    <button className="action" key={name} type="button" aria-pressed={setting === id} onClick={() => setSetting(id)}>{name}</button>
                  ))}
                </div>
                <h2>{settings[setting]}</h2><p>{settingsDescriptions[setting]}</p>
              </div>
            )}
            {index === 3 && (
              <div className="panel"><h2>Pratinjau Kartu</h2><p>Belum ada data peserta untuk ditampilkan.</p>
                {format !== null && <p>Format terpilih: {formats[format]}.</p>}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
