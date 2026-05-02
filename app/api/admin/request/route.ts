import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getMailer } from '@/lib/email';
import { SUPERADMIN_EMAIL } from '@/lib/auth';

export async function POST(_req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('name,email')
    .eq('id', user.id)
    .single();

  const mailer = getMailer();
  if (!mailer) {
    return NextResponse.json(
      { error: 'Email is not configured. Ask the superadmin for the invite key directly.' },
      { status: 503 },
    );
  }

  await mailer.sendMail({
    from: process.env.GMAIL_USER,
    to: SUPERADMIN_EMAIL,
    subject: `[JK&R] Admin access request — ${profile?.name ?? user.email}`,
    text: `${profile?.name ?? user.email} (${profile?.email ?? user.email}) is requesting admin access to the JK&R Support Portal.\n\nReply with the invite key if you approve.`,
  });

  return NextResponse.json({ ok: true });
}
