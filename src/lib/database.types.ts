export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          user_id: string;
          jersey_number: number;
          first_name: string;
          last_name: string;
          position: 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';
          avatar_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          jersey_number: number;
          first_name: string;
          last_name: string;
          position: 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';
          avatar_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          jersey_number?: number;
          first_name?: string;
          last_name?: string;
          position?: 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';
          avatar_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          opponent_name: string;
          date: string;
          location: string;
          status: 'in-progress' | 'completed';
          is_serving_first: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          opponent_name: string;
          date?: string;
          location?: string;
          status?: 'in-progress' | 'completed';
          is_serving_first?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          opponent_name?: string;
          date?: string;
          location?: string;
          status?: 'in-progress' | 'completed';
          is_serving_first?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          match_id: string;
          set_number: number;
          our_score: number;
          their_score: number;
          status: 'in-progress' | 'completed';
        };
        Insert: {
          id?: string;
          match_id: string;
          set_number: number;
          our_score?: number;
          their_score?: number;
          status?: 'in-progress' | 'completed';
        };
        Update: {
          id?: string;
          match_id?: string;
          set_number?: number;
          our_score?: number;
          their_score?: number;
          status?: 'in-progress' | 'completed';
        };
        Relationships: [
          {
            foreignKeyName: 'sets_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
        ];
      };
      rallies: {
        Row: {
          id: string;
          set_id: string;
          rally_number: number;
          point_won: boolean;
        };
        Insert: {
          id?: string;
          set_id: string;
          rally_number: number;
          point_won: boolean;
        };
        Update: {
          id?: string;
          set_id?: string;
          rally_number?: number;
          point_won?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'rallies_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          },
        ];
      };
      touches: {
        Row: {
          id: string;
          rally_id: string;
          touch_number: number;
          type: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score: number;
          player_jersey_number: number;
        };
        Insert: {
          id?: string;
          rally_id: string;
          touch_number: number;
          type: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score: number;
          player_jersey_number: number;
        };
        Update: {
          id?: string;
          rally_id?: string;
          touch_number?: number;
          type?: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score?: number;
          player_jersey_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'touches_rally_id_fkey';
            columns: ['rally_id'];
            isOneToOne: false;
            referencedRelation: 'rallies';
            referencedColumns: ['id'];
          },
        ];
      };
      rotations: {
        Row: {
          id: string;
          set_id: string;
          rotation_number: number;
          positions: Record<string, number>;
        };
        Insert: {
          id?: string;
          set_id: string;
          rotation_number: number;
          positions: Record<string, number>;
        };
        Update: {
          id?: string;
          set_id?: string;
          rotation_number?: number;
          positions?: Record<string, number>;
        };
        Relationships: [
          {
            foreignKeyName: 'rotations_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
