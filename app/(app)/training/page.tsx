import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { MODULE_FILES } from '@/lib/foreman-corpus';
import { ForemanChat } from '@/components/foreman-chat';

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@400;500;600;700&display=swap"
      />
      <style>{TRAINING_CSS}</style>

      <div className="training-root">
        <div className="training-wrap">
          <header className="training-header">
            <div className="training-eyebrow">JK&amp;R FIELD ACADEMY</div>
            <h1 className="training-title">Training Material</h1>
            <p className="training-sub">The eight pillars. Read them. Drill them. Run them.</p>
          </header>

          <section className="training-grid">
            {MODULE_FILES.map((m) => (
              <a key={m.id} href={`/training/${m.file}`} className="training-card">
                <div className="card-eyebrow">PDF {String(m.n).padStart(2, '0')}</div>
                <div className="card-title">{m.title}</div>
                <p className="card-desc">{m.description}</p>
                <span className="card-link">Open module →</span>
              </a>
            ))}
          </section>

          <ForemanChat />
        </div>
      </div>
    </>
  );
}

const TRAINING_CSS = `
.training-root {
  background: #0d1117;
  color: #e6edf3;
  min-height: 100%;
  height: 100%;
  overflow-y: auto;
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
  line-height: 1.7;
}
.training-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 40px 96px;
}
.training-header {
  border-bottom: 1px solid #21262d;
  padding-bottom: 24px;
  margin-bottom: 36px;
}
.training-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #c9a227;
  margin-bottom: 8px;
}
.training-title {
  font-family: 'Oswald', sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #e6edf3;
  letter-spacing: 0.5px;
}
.training-sub {
  font-size: 14px;
  color: #8b949e;
  margin-top: 6px;
}
.training-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}
@media (max-width: 900px) { .training-grid { grid-template-columns: 1fr; } }
.training-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 22px 22px 18px;
  background: #161b22;
  border: 1px solid #21262d;
  border-top: 2px solid transparent;
  transition: border-color .15s ease, background .15s ease;
  cursor: pointer;
  border-radius: 0;
}
.training-card:hover { border-top-color: #c9a227; background: #1a2029; }
.training-card.kpi-card { border-top: 2px solid #c9a227; }
.card-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #c9a227;
  margin-bottom: 4px;
}
.card-title {
  font-family: 'Oswald', sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #e6edf3;
}
.card-desc {
  font-size: 13.5px;
  color: #8b949e;
  line-height: 1.6;
  margin-top: 4px;
  flex: 1;
}
.card-link {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #c9a227;
  margin-top: 16px;
}

.foreman-panel {
  border: 1px solid #21262d;
  border-top: 2px solid #c9a227;
  background: #161b22;
  padding: 28px 28px 24px;
}
.foreman-header { margin-bottom: 18px; }
.foreman-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #c9a227;
}
.foreman-sub {
  font-size: 13px;
  color: #8b949e;
  margin-top: 4px;
}
.foreman-stream {
  margin: 18px 0 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;
}
.f-msg-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.f-msg.user .f-msg-label { color: #8b949e; }
.f-msg.assistant .f-msg-label { color: #c9a227; }
.f-msg-text {
  font-size: 14px;
  color: #e6edf3;
  line-height: 1.7;
  white-space: pre-wrap;
  border-left: 2px solid #21262d;
  padding: 4px 14px;
}
.f-msg.assistant .f-msg-text { border-left-color: #c9a227; }
.f-err {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #b84a3f;
  margin: 8px 0;
}
.foreman-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: end;
  border-top: 1px solid #21262d;
  padding-top: 18px;
}
.foreman-field {
  position: relative;
}
.foreman-field input {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #21262d;
  color: #e6edf3;
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
  padding: 10px 0;
  outline: none;
  caret-color: #c9a227;
}
.foreman-field input::placeholder { color: #484f58; }
.f-underline {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 1px;
  width: 0%;
  background: #c9a227;
  transition: width 280ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}
.foreman-field:focus-within .f-underline { width: 100%; }
.foreman-btn {
  background: #c9a227;
  color: #000;
  border: 0;
  padding: 12px 20px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .15s ease, opacity .15s ease;
  border-radius: 0;
}
.foreman-btn:hover:not(:disabled) { background: #d9b831; }
.foreman-btn:disabled { opacity: .45; cursor: not-allowed; }
`;
