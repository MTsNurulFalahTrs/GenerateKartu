import { EditorIcon } from './editor-icon';
import { cardPages, defaultPaper, pageGrid, paperDimensions, paperEdges, paperLayoutError, paperSizes } from '../../lib/cards/print-layout';
import type { PaperSettings } from '../../lib/cards/print-layout';
import { validCardLayout } from '../../lib/cards/settings';
import type { CardSettings } from '../../lib/cards/settings';

const edgeLabels = { top: 'Atas', right: 'Kanan', bottom: 'Bawah', left: 'Kiri' };

export function PaperSettingsPanel({ value, onChange }: {
  value: CardSettings;
  onChange: (settings: CardSettings) => void;
}) {
  const { paper, width, height } = value;
  const sheet = paperDimensions(paper);
  const error = !validCardLayout(value)
    ? 'Periksa ukuran kartu dan ukuran teks di Layout & Cetak.'
    : paperLayoutError(paper, width, height);
  const layout = error ? null : cardPages([], width, height, paper);
  const capacity = layout ? layout.columns * layout.rows : 0;
  const grid = layout && pageGrid(layout, capacity);

  function update(changes: Partial<PaperSettings>) {
    onChange({ ...value, paper: { ...paper, ...changes } });
  }

  return <div className="paper-settings">
    <div className="paper-fields">
      <fieldset>
        <legend><EditorIcon name="document" /> Ukuran & orientasi</legend>
        <p className="settings-control-help">Pilih ukuran lembar dan arah cetaknya.</p>
        <div className="paper-options">
          <label>Ukuran kertas<select value={paper.size} onChange={(event) =>
            update({ size: event.target.value as PaperSettings['size'] })}>
            {Object.entries(paperSizes).map(([name, [short, long]]) =>
              <option key={name} value={name}>{name} ({short} × {long} mm)</option>)}
          </select></label>
          <label>Orientasi<select value={paper.orientation} onChange={(event) =>
            update({ orientation: event.target.value as PaperSettings['orientation'] })}>
            <option value="portrait">Potret</option><option value="landscape">Lanskap</option>
          </select></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><EditorIcon name="clipboard" /> Margin kertas (mm)</legend>
        <p className="settings-control-help">Atur jarak dari setiap tepi kertas antara 0 dan 50 mm.</p>
        <div className="paper-options">
          {paperEdges.map((edge) => {
            const margin = paper.margins[edge];
            return <label key={edge}>{edgeLabels[edge]}
              <span className="paper-margin-input"><input type="number" min={0} max={50} step="any" value={Number.isNaN(margin) ? '' : margin}
                aria-invalid={!Number.isFinite(margin) || margin < 0 || margin > 50}
                aria-describedby={error ? 'paper-settings-error' : undefined}
                onChange={(event) => update({ margins: { ...paper.margins, [edge]: event.target.valueAsNumber } })} /><span aria-hidden="true">mm</span></span>
            </label>;
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend><EditorIcon name="table" /> Perataan susunan kartu</legend>
        <p className="settings-control-help">Tentukan posisi kelompok kartu di dalam area margin.</p>
        <div className="paper-options">
          <label>Horizontal<select value={paper.horizontal} onChange={(event) =>
            update({ horizontal: event.target.value as PaperSettings['horizontal'] })}>
            <option value="start">Kiri</option><option value="center">Tengah</option><option value="end">Kanan</option>
          </select></label>
          <label>Vertikal<select value={paper.vertical} onChange={(event) =>
            update({ vertical: event.target.value as PaperSettings['vertical'] })}>
            <option value="start">Atas</option><option value="center">Tengah</option><option value="end">Bawah</option>
          </select></label>
        </div>
      </fieldset>
      <button className="action" type="button" onClick={() => update(defaultPaper)}>Pulihkan setelan kertas bawaan</button>
    </div>

    <div className="paper-overview">
      <h3><EditorIcon name="eye" /> Pratinjau susunan kertas</h3>
      <p>{paper.size} · {sheet.width} × {sheet.height} mm</p>
      <div className="paper-diagram" style={{ aspectRatio: sheet.width / sheet.height }} aria-hidden="true">
        {grid && layout && <>
          <span className="paper-diagram-area" style={{
            inset: `${100 * paper.margins.top / sheet.height}% ${100 * paper.margins.right / sheet.width}% ${100 * paper.margins.bottom / sheet.height}% ${100 * paper.margins.left / sheet.width}%`,
          }} />
          {Array.from({ length: capacity }, (_, index) => <span key={index} className="paper-diagram-card" style={{
            left: `${100 * (grid.left + (index % grid.columns) * (width + layout.gap)) / sheet.width}%`,
            top: `${100 * (grid.top + Math.floor(index / grid.columns) * (height + layout.gap)) / sheet.height}%`,
            width: `${100 * width / sheet.width}%`,
            height: `${100 * height / sheet.height}%`,
          }} />)}
        </>}
      </div>
      {grid && <ul className="paper-diagram-key"><li>Area di dalam margin</li><li>Posisi kartu</li></ul>}
      {error ? <p className="field-error" id="paper-settings-error" role="alert">{error}</p> :
        <p role="status"><strong>{capacity} kartu per lembar</strong> ({layout?.columns} kolom × {layout?.rows} baris)</p>}
      <small>Untuk cetak fisik, pilih ukuran kertas yang sama di dialog printer, skala 100%, dan tanpa margin tambahan.</small>
    </div>
  </div>;
}
