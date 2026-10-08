export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          name: string;
          campus: string;
          course: string | null;
          year: string | null;
          bio: string | null;
          meetup: string | null;
          rating: number | null;
          trades: number | null;
          verified: boolean | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email: string;
          name: string;
          campus: string;
          course?: string | null;
          year?: string | null;
          bio?: string | null;
          meetup?: string | null;
          rating?: number | null;
          trades?: number | null;
          verified?: boolean | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string;
          name?: string;
          campus?: string;
          course?: string | null;
          year?: string | null;
          bio?: string | null;
          meetup?: string | null;
          rating?: number | null;
          trades?: number | null;
          verified?: boolean | null;
          avatar_url?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          created_at: string;
          seller_id: string;
          name: string;
          category: string;
          price: number;
          condition: string;
          description: string;
          image_url: string | null;
          status: string;
          watch: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          seller_id: string;
          name: string;
          category: string;
          price: number;
          condition: string;
          description: string;
          image_url?: string | null;
          status?: string;
          watch?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          seller_id?: string;
          name?: string;
          category?: string;
          price?: number;
          condition?: string;
          description?: string;
          image_url?: string | null;
          status?: string;
          watch?: number | null;
        };
      };
      chats: {
        Row: {
          id: string;
          created_at: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          listing_id?: string;
          buyer_id?: string;
          seller_id?: string;
          last_message_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          chat_id: string;
          sender_id: string;
          type: string;
          text: string | null;
          amount: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          chat_id: string;
          sender_id: string;
          type: string;
          text?: string | null;
          amount?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          chat_id?: string;
          sender_id?: string;
          type?: string;
          text?: string | null;
          amount?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
    ? PublicTableNameOrOptions
    : never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName]
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'])
  ? Database['public']['Tables'][PublicTableNameOrOptions]
  : never;

export type Users = Tables<'users'>;
export type Listings = Tables<'listings'>;
export type Chats = Tables<'chats'>;
export type Messages = Tables<'messages'>;