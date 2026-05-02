'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CodeRow = {
  code: string;
  email_invited: string | null;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
};

export function IssueCodePanel({ codes }: { codes: CodeRow[] }) {
  const router = useRouter();
  const [emailInvited, setEmailInvited] = useState('');
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setIssued(null);
    const res = await fetch('/api/admin/issue-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_invited: emailInvited || undefined }),
    });
    setBusy(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(json.error || 'Issue failed'); return; }
    setIssued(json.code);
    setEmailInvited('');
    router.refresh();
  };

  return (
    <div className="codes-panel">
      <form onSubmit={issue} className="codes-form">
        <input
          type="email"
          placeholder="invitee@email.com (optional — for record)"
          value={emailInvited}
          onChange={(e) => setEmailInvited(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'ISSUING' : 'ISSUE CODE'}
        </button>
      </form>
      {issued && (
        <div className="codes-issued">
          <div className="ci-label">NEW CODE</div>
          <div className="ci-code">{issued}</div>
          <div className="ci-help">Copy this and send to the invitee. Codes expire in 14 days.</div>
        </div>
      )}
      {err && <div className="codes-err">{err}</div>}

      <div className="codes-table">
        <div className="ct-row ct-head">
          <span>CODE</span><span>EMAIL</span><span>STATUS</span><span>EXPIRES</span>
        </div>
        {codes.map((c) => {
          const expired = !c.redeemed_at && new Date(c.expires_at) < new Date();
          return (
            <div key={c.code} className="ct-row">
              <span className="codes-code">{c.code}</span>
              <span>{c.email_invited ?? '—'}</span>
              <span className={c.redeemed_at ? 'status-redeemed' : expired ? 'status-expired' : 'status-open'}>
                {c.redeemed_at ? 'REDEEMED' : expired ? 'EXPIRED' : 'OPEN'}
              </span>
              <span>{new Date(c.expires_at).toLocaleDateString()}</span>
            </div>
          );
        })}
        {codes.length === 0 && <div className="ct-empty">No codes issued yet.</div>}
      </div>

      <style>{CODE_CSS}</style>
    </div>
  );
}

const CODE_CSS = `
.codes-panel { display: flex; flex-direction: column; gap: 14px; }
.codes-form { display: grid; grid-template-columns: 1fr auto; gap: 12px; }
.codes-form input {
  background: #050505; border: 1px solid #1A1A1A; color: #F5F5F5;
  padding: 10px 14px; font-size: 14px; outline: none;
}
.codes-form input:focus { border-color: #C9A961; }
.codes-form button {
  background: #C9A961; color: #000; border: 0; padding: 10px 22px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;
  cursor: pointer; border-radius: 0;
  transition: background 150ms ease, opacity 150ms ease;
}
.codes-form button:hover:not(:disabled) { background: #D9B871; }
.codes-form button:disabled { opacity: 0.4; cursor: not-allowed; }

.codes-issued {
  border: 1px solid #C9A961;
  background: rgba(201,169,97,0.08);
  padding: 14px 16px;
}
.ci-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; letter-spacing: 2px; color: #C9A961;
  text-transform: uppercase; margin-bottom: 4px;
}
.ci-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px; font-weight: 600; color: #F5C84B; letter-spacing: 0.12em;
}
.ci-help { font-size: 12px; color: #8A8A8A; margin-top: 4px; }
.codes-err { color: #B84A3F; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }

.codes-table .codes-code { font-family: 'JetBrains Mono', monospace; color: #F5C84B; letter-spacing: 0.06em; }
.status-open { color: #6E8B5A; font-weight: 600; }
.status-redeemed { color: #8A8A8A; }
.status-expired { color: #B84A3F; }
`;
