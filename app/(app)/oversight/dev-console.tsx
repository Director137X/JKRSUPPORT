'use client';

import { useState } from 'react';

type DiagResult = {
  ok?: boolean;
  reply?: string;
  latency_ms?: number;
  model_used?: string;
  message?: string;
  status?: number;
  name?: string;
  cause?: string | null;
  keyMeta?: { length: number; starts_with_sk_ant: boolean; has_trailing_whitespace: boolean; first8: string | null; last4: string | null };
  model?: string;
  sdkVersion?: string;
  where?: string;
  reason?: string;
};

export function DevConsole() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string | null>(null);

  const run = async (path: string, label: string) => {
    setBusy(true);
    setOut(`PROBE: ${label}\n  GET ${path}\n\n…`);
    try {
      const t0 = Date.now();
      const res = await fetch(path);
      const dt = Date.now() - t0;
      const text = await res.text();
      let parsed: any = text;
      try { parsed = JSON.parse(text); } catch {}
      const formatted = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed);
      setOut(
        `PROBE: ${label}\n  GET ${path}\n  status: ${res.status}\n  duration: ${dt}ms\n\n${formatted}`,
      );
    } catch (err) {
      setOut(`PROBE: ${label}\nERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dev-console">
      <div className="dev-actions">
        <button type="button" className="dev-btn" disabled={busy} onClick={() => run('/api/diagnose', 'Anthropic ping')}>Anthropic ping</button>
        <button type="button" className="dev-btn" disabled={busy} onClick={() => run('/api/health/db', 'DB health')}>DB health</button>
        <button type="button" className="dev-btn" disabled={busy} onClick={() => run('/api/health/env', 'Env check')}>Env check</button>
      </div>

      <div className="dev-row">
        <span className="dev-key">RUNTIME</span>
        <span className="dev-val">vercel · nodejs · {typeof window !== 'undefined' ? new Date().toLocaleString() : '—'}</span>
        <span className="dev-status ok">●</span>
      </div>
      <div className="dev-row">
        <span className="dev-key">REGION</span>
        <span className="dev-val">us-east-1 (Supabase) · iad1 (Vercel)</span>
        <span className="dev-status ok">●</span>
      </div>
      <div className="dev-row">
        <span className="dev-key">CHANNELS</span>
        <span className="dev-val">circle_messages, dm_messages, messages (realtime)</span>
        <span className="dev-status ok">●</span>
      </div>

      {out && <pre className="dev-out">{out}</pre>}
    </div>
  );
}
