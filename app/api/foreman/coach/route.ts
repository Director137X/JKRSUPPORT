import { NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { createServerClient } from '@/lib/supabase/server';
import { FOREMAN_IDENTITY, FOREMAN_MODEL } from '@/lib/foreman-prompt';
import { corpusForPrompt } from '@/lib/foreman-corpus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { conversationId?: string; message: string };

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }
  const userMessage = (body.message ?? '').trim();
  if (!userMessage) return new NextResponse('Empty message', { status: 400 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('name,email,role,position,is_anonymous')
    .eq('id', user.id)
    .single() as any;

  const { data: kpiRows } = await supabase
    .from('kpis')
    .select('recorded_for,tod_minutes,dmc,odm,ubc,sfc,signed,sold,notes')
    .eq('user_id', user.id)
    .order('recorded_for', { ascending: false })
    .limit(7) as any;

  let conversationId = body.conversationId;
  if (!conversationId) {
    const title = `[Foreman] ${userMessage.slice(0, 60)}`;
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single() as any;
    if (convErr || !conv) {
      console.error('[foreman] create conversation failed:', convErr);
      return new NextResponse('Failed to create conversation', { status: 500 });
    }
    conversationId = conv.id as string;
  }

  const { error: insertErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userMessage,
  });
  if (insertErr) {
    console.error('[foreman] insert user message failed:', insertErr);
    return new NextResponse('Failed to save user message', { status: 500 });
  }

  const { data: history } = await supabase
    .from('messages')
    .select('role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(12);
  const ordered = (history ?? []).reverse() as { role: 'user' | 'assistant'; content: string }[];
  // Anthropic requires the first message to be a user turn. Trim any
  // assistant messages from the front of the window.
  while (ordered.length && ordered[0].role !== 'user') ordered.shift();

  const kpiBlock = (kpiRows ?? []).length
    ? buildKpiBlock(kpiRows as any[])
    : 'OPERATOR KPIs (last 7 days)\n  No KPIs logged yet — prompt the rep to start tracking via /training/kpi.';

  const operatorContext = profile
    ? `OPERATOR PROFILE
  Name: ${profile.is_anonymous ? 'Anonymous Operator' : profile.name ?? 'Unknown'}
  Role: ${profile.role ?? 'user'} (${profile.position ?? 'unspecified'})

${kpiBlock}`
    : `OPERATOR PROFILE
  Unknown.

${kpiBlock}`;

  const corpusBlock = corpusForPrompt();

  let stream;
  try {
    stream = await anthropic.messages.stream({
      model: FOREMAN_MODEL,
      max_tokens: 1500,
      // Single cache breakpoint at end of corpus — its prefix (identity +
      // corpus, ~24K tokens) clears Haiku's 2048-token minimum. Caching the
      // identity block alone would error because it's only ~1.7K tokens.
      system: [
        { type: 'text', text: FOREMAN_IDENTITY },
        { type: 'text', text: corpusBlock, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: operatorContext },
      ],
      messages: ordered.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    console.error('[foreman] anthropic stream init failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Foreman request failed', detail: message, conversationId },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  let fullText = '';

  const readable = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`),
      );
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`),
            );
          }
        }
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullText,
        });
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        console.error('[foreman] anthropic stream error:', err);
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

function buildKpiBlock(rows: any[]): string {
  const lines: string[] = ['OPERATOR KPIs (last 7 days, newest first)'];
  lines.push('  DATE       TOD   DMC   ODM   UBC   SFC   SIGNED   SOLD   NOTES');
  for (const r of rows) {
    const pad = (n: number, w: number) => String(n ?? 0).padStart(w, ' ');
    lines.push(
      `  ${r.recorded_for}  ${pad(r.tod_minutes, 4)}  ${pad(r.dmc, 4)}  ${pad(r.odm, 4)}  ${pad(r.ubc, 4)}  ${pad(r.sfc, 4)}  ${pad(r.signed, 6)}   ${pad(r.sold, 4)}   ${r.notes ?? ''}`,
    );
  }
  const totals = rows.reduce(
    (acc, r) => ({
      tod: acc.tod + (r.tod_minutes ?? 0),
      dmc: acc.dmc + (r.dmc ?? 0),
      odm: acc.odm + (r.odm ?? 0),
      ubc: acc.ubc + (r.ubc ?? 0),
      sfc: acc.sfc + (r.sfc ?? 0),
      signed: acc.signed + (r.signed ?? 0),
      sold: acc.sold + (r.sold ?? 0),
    }),
    { tod: 0, dmc: 0, odm: 0, ubc: 0, sfc: 0, signed: 0, sold: 0 },
  );
  lines.push(
    `  TOTALS:    ${totals.tod}min, ${totals.dmc} DMC, ${totals.odm} ODM, ${totals.ubc} UBC, ${totals.sfc} SFC, ${totals.signed} SIGNED, ${totals.sold} SOLD.`,
  );
  if (totals.dmc > 0) {
    const closeRate = ((totals.signed / totals.dmc) * 100).toFixed(1);
    const odmRate = ((totals.odm / totals.dmc) * 100).toFixed(1);
    lines.push(`  RATIOS:    SIGNED/DMC = ${closeRate}%; ODM/DMC = ${odmRate}%.`);
  }
  return lines.join('\n');
}
