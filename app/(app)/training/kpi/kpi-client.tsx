'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { KPI } from '@/types/database';

const FIELDS: { key: keyof Omit<KPI, 'id' | 'user_id' | 'recorded_for' | 'notes' | 'created_at' | 'updated_at'>; label: string; abbrev: string; help: string }[] = [
  { key: 'tod_minutes', label: 'Time on Doors',          abbrev: 'TOD', help: 'minutes knocking' },
  { key: 'dmc',         label: 'Decision Makers Contacted', abbrev: 'DMC', help: 'engaged at door' },
  { key: 'odm',         label: 'Off-Door Movements',     abbrev: 'ODM', help: 'pulled off doorstep' },
  { key: 'ubc',         label: 'Bills Collected',        abbrev: 'UBC', help: 'insurance reviewed' },
  { key: 'sfc',         label: 'Setter Forms Completed', abbrev: 'SFC', help: 'appt packets done' },
  { key: 'signed',      label: 'Signed Deals',           abbrev: 'SIGNED', help: 'contracts signed' },
  { key: 'sold',        label: 'Sold Textouts',          abbrev: 'SOLD', help: 'post-close confirms' },
];

export function KpiClient({ today, recent }: { today: KPI | null; recent: KPI[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    tod_minutes: today?.tod_minutes ?? 0,
    dmc: today?.dmc ?? 0,
    odm: today?.odm ?? 0,
    ubc: today?.ubc ?? 0,
    sfc: today?.sfc ?? 0,
    signed: today?.signed ?? 0,
    sold: today?.sold ?? 0,
    notes: today?.notes ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : Math.max(0, v) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch('/api/kpis/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      setSavedAt(new Date().toLocaleTimeString());
      router.refresh();
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Save failed' }));
      setErr(error || 'Save failed');
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <style>{KPI_CSS}</style>

      <div className="kpi-root">
        <div className="kpi-wrap">
          <header className="kpi-header">
            <div className="kpi-eyebrow">JK&amp;R FIELD ACADEMY · MODULE 1</div>
            <h1 className="kpi-title">KPI Tracker</h1>
            <p className="kpi-sub">Log today's numbers. The Foreman pulls from this when you ask for slump diagnosis.</p>
          </header>

          <form onSubmit={save} className="kpi-form">
            <div className="kpi-grid">
              {FIELDS.map((f) => (
                <div key={f.key} className="kpi-cell">
                  <div className="kpi-cell-head">
                    <span className="kpi-abbrev">{f.abbrev}</span>
                    <span className="kpi-help">{f.help}</span>
                  </div>
                  <label className="kpi-label">{f.label}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form[f.key] as number}
                    onChange={(e) => set(f.key, parseInt(e.target.value || '0', 10))}
                  />
                </div>
              ))}
            </div>

            <div className="kpi-notes">
              <label>Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="What worked, what stalled, what to drill tomorrow…"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>

            <div className="kpi-actions">
              <button type="submit" disabled={busy} className="kpi-save">
                {busy ? 'SAVING' : 'SAVE TODAY'}
              </button>
              {savedAt && <span className="kpi-saved-at">Saved at {savedAt}</span>}
              {err && <span className="kpi-err">{err}</span>}
            </div>
          </form>

          <section className="kpi-recent">
            <h2 className="kpi-section">RECENT — LAST 14 DAYS</h2>
            <div className="kpi-table">
              <div className="row head">
                <span>DATE</span><span>TOD</span><span>DMC</span><span>ODM</span><span>UBC</span><span>SFC</span><span>SIGNED</span><span>SOLD</span>
              </div>
              {recent.map((k) => (
                <div key={k.id} className="row">
                  <span>{k.recorded_for}</span>
                  <span>{k.tod_minutes}</span>
                  <span>{k.dmc}</span>
                  <span>{k.odm}</span>
                  <span>{k.ubc}</span>
                  <span>{k.sfc}</span>
                  <span>{k.signed}</span>
                  <span>{k.sold}</span>
                </div>
              ))}
              {recent.length === 0 && <div className="empty">No KPIs logged yet. Today is day one.</div>}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const KPI_CSS = `
.kpi-root { background: #0d1117; color: #e6edf3; min-height: 100%; height: 100%; overflow-y: auto; font-family: 'Barlow', sans-serif; font-size: 14px; }
.kpi-wrap { max-width: 1080px; margin: 0 auto; padding: 48px 40px 96px; }
.kpi-header { border-bottom: 1px solid #21262d; padding-bottom: 22px; margin-bottom: 28px; }
.kpi-eyebrow { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c9a227; margin-bottom: 6px; }
.kpi-title { font-family: 'Oswald', sans-serif; font-size: 30px; font-weight: 600; }
.kpi-sub { color: #8b949e; font-size: 13px; margin-top: 4px; }

.kpi-form { display: flex; flex-direction: column; gap: 22px; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

.kpi-cell { border: 1px solid #21262d; background: #161b22; padding: 14px 16px; }
.kpi-cell-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.kpi-abbrev { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #c9a227; text-transform: uppercase; }
.kpi-help { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #484f58; }
.kpi-label { color: #8b949e; font-size: 12px; margin: 6px 0 8px; display: block; }
.kpi-cell input {
  width: 100%; background: transparent; border: 0; border-bottom: 1px solid #21262d;
  color: #e6edf3; font-family: 'Oswald', sans-serif; font-size: 24px; padding: 8px 0; outline: none;
  caret-color: #c9a227;
}
.kpi-cell input:focus { border-bottom-color: #c9a227; }

.kpi-notes label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #c9a227; margin-bottom: 8px; display: block; }
.kpi-notes textarea {
  width: 100%; background: #050505; border: 1px solid #21262d; color: #e6edf3;
  font-family: 'Barlow', sans-serif; font-size: 14px; padding: 12px 14px; outline: none;
  resize: vertical; line-height: 1.6;
}
.kpi-notes textarea:focus { border-color: #c9a227; }

.kpi-actions { display: flex; align-items: center; gap: 16px; }
.kpi-save {
  background: #c9a227; color: #000; border: 0; padding: 12px 22px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;
  cursor: pointer; border-radius: 0;
  transition: background 150ms ease, opacity 150ms ease;
}
.kpi-save:hover:not(:disabled) { background: #d9b831; }
.kpi-save:disabled { opacity: 0.5; cursor: not-allowed; }
.kpi-saved-at { color: #6E8B5A; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
.kpi-err { color: #b84a3f; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }

.kpi-recent { margin-top: 48px; }
.kpi-section { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c9a227; margin-bottom: 12px; }
.kpi-table { border: 1px solid #21262d; background: #161b22; }
.kpi-table .row {
  display: grid; grid-template-columns: 1.4fr repeat(7, 1fr);
  padding: 8px 14px; border-bottom: 1px solid #21262d;
  font-size: 13px;
}
.kpi-table .row:last-child { border-bottom: 0; }
.kpi-table .row.head {
  background: #0d1117;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c9a227;
}
.kpi-table .empty { padding: 22px 14px; color: #484f58; text-align: center; font-style: italic; }
`;
