# JK&R Sales Coach — Support Portal

Next.js 14 (App Router) + Supabase + Anthropic Claude. Spartan / black-and-gold UI.

## Stack

- Next.js 14 + TypeScript + Tailwind
- Supabase (Postgres, Auth, RLS)
- Anthropic Claude (Sonnet 4.5) with prompt caching
- Nodemailer (Gmail SMTP) for admin-request emails
- Deployed on Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev
```

Open http://localhost:3000.

## Required environment variables

Set these in Vercel → Project Settings → Environment Variables:

| Name | Source |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` secret |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com → API keys |
| `SUPERADMIN_EMAIL` | The email that becomes superadmin on signup |
| `ADMIN_INVITE_KEY` | Pick any string — share it manually with reps you promote |
| `GMAIL_USER` | Gmail address sending admin-request emails (optional) |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16 chars, no spaces) (optional) |
| `NEXT_PUBLIC_APP_URL` | e.g. `https://jkrsupport.vercel.app` |
| `NEXT_PUBLIC_LOGIN_VIDEO_URL` | (optional) mp4 URL for login background |

## Roles

- `user` — default for new signups.
- `admin` — granted via `ADMIN_INVITE_KEY` redemption or by superadmin.
- `superadmin` — auto-assigned on signup if email matches `SUPERADMIN_EMAIL`.

## Database

Schema is applied via Supabase migrations on the linked project. Tables:
- `profiles` — mirrors `auth.users`, with `role` and `is_anonymous`
- `conversations` — one row per chat thread
- `messages` — chat messages with `role in ('user','assistant')`
- View `admin_conversations` — joined view used by the admin dashboard.

RLS is enabled. Users see only their own data; admins/superadmins see all.

## AI Coach

`app/api/coach/route.ts` streams Claude over Server-Sent Events, persists every message to Supabase, and uses the system prompt in `lib/coach-prompt.ts` (8 verbatim JK&R training modules with Anthropic prompt caching).
