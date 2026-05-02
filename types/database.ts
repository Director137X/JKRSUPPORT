export type Role = 'user' | 'admin' | 'superadmin';
export type Position = 'closer' | 'setter' | 'admin' | 'superadmin' | null;

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  position: Position;
  is_anonymous: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type CircleMessage = {
  id: string;
  author_id: string;
  is_anonymous: boolean;
  body: string;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export type CircleFeedRow = {
  id: string;
  display_name: string;
  author_name: string | null;
  author_email: string | null;
  author_role: Role;
  author_position: Position;
  is_anonymous: boolean;
  body: string;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
};

export type DMThread = {
  id: string;
  rep_id: string;
  admin_id: string;
  created_at: string;
  last_message_at: string;
};

export type DMMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type KPI = {
  id: string;
  user_id: string;
  recorded_for: string;
  tod_minutes: number;
  dmc: number;
  odm: number;
  ubc: number;
  sfc: number;
  signed: number;
  sold: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminInviteCode = {
  code: string;
  created_by: string;
  email_invited: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
};
