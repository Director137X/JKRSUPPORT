export type Role = 'user' | 'admin' | 'superadmin';

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: Role;
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation> & { user_id: string; title: string };
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & { conversation_id: string; role: 'user' | 'assistant'; content: string };
        Update: Partial<Message>;
        Relationships: [];
      };
    };
    Views: {
      admin_conversations: {
        Row: Conversation & {
          user_email: string;
          user_name: string;
          user_is_anonymous: boolean;
          message_count: number;
          first_user_message: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: { user_role: Role };
    CompositeTypes: Record<string, never>;
  };
};
