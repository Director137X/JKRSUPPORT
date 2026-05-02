import { NextResponse } from 'next/server';
import { anthropic, COACH_MODEL, COACH_SYSTEM_PROMPT } from '@/lib/anthropic';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  conversationId?: string;
  message: string;
};

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

  // Resolve / create conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const title = userMessage.slice(0, 60);
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();
    if (convErr || !conv) return new NextResponse('Failed to create conversation', { status: 500 });
    conversationId = conv.id;
  }

  // Save user message
  const { error: insertErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userMessage,
  });
  if (insertErr) return new NextResponse('Failed to save user message', { status: 500 });

  // Pull last 10 messages for context
  const { data: history } = await supabase
    .from('messages')
    .select('role,content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const ordered = (history ?? []).reverse();

  let stream;
  try {
    stream = await anthropic.messages.stream({
      model: COACH_MODEL,
      max_tokens: 1024,
      system: [{ type: 'text', text: COACH_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: ordered.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
  } catch (err) {
    console.error('[coach] anthropic stream init failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'AI request failed', detail: message, conversationId },
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
        console.error('[coach] anthropic stream error:', err);
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
