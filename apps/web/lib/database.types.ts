export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      crawler_events: {
        Row: {
          bot_name: string;
          bot_type: string;
          id: string;
          ip_hash: string | null;
          occurred_at: string;
          page_path: string;
          page_url: string;
          platform: string;
          raw_payload: Json;
          site_id: string;
          source: string;
          user_agent: string;
        };
        Insert: {
          bot_name?: string;
          bot_type?: string;
          id?: string;
          ip_hash?: string | null;
          occurred_at?: string;
          page_path: string;
          page_url: string;
          platform?: string;
          raw_payload?: Json;
          site_id: string;
          source?: string;
          user_agent: string;
        };
        Update: Partial<Database["public"]["Tables"]["crawler_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "crawler_events_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          }
        ];
      };
      sites: {
        Row: {
          created_at: string;
          domain: string;
          id: string;
          log_non_ai_traffic: boolean;
          name: string | null;
          tracking_token: string;
          user_id: string;
          verified_at: string | null;
          verification_token: string;
        };
        Insert: {
          created_at?: string;
          domain: string;
          id?: string;
          log_non_ai_traffic?: boolean;
          name?: string | null;
          tracking_token?: string;
          user_id: string;
          verified_at?: string | null;
          verification_token?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sites"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
