import { CoachChat } from '@/components/coach-chat';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Latest conversation, if any
  const { data: latest } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let messages: { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; created_at: string }[] = [];
  if (latest) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', latest.id)
      .order('created_at', { ascending: true });
    messages = data ?? [];
  }

  return (
    <CoachChat
      initialConversationId={latest?.id ?? null}
      initialMessages={messages}
    />
  );
}
