export type TeamRole = 'head_coach' | 'assistant_coach' | 'viewer';

export type Database = {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          date_start: string | null;
          date_end: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          date_start?: string | null;
          date_end?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          date_start?: string | null;
          date_end?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'seasons_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          date_start: string;
          date_end: string | null;
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          date_start?: string;
          date_end?: string | null;
          location?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          name?: string;
          date_start?: string;
          date_end?: string | null;
          location?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'seasons';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: TeamRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
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
          team_id: string;
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
          team_id?: string;
          jersey_number?: number;
          first_name?: string;
          last_name?: string;
          position?: 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';
          avatar_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'players_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          team_id: string;
          season_id: string | null;
          event_id: string | null;
          opponent_name: string;
          date: string;
          location: string;
          status: 'in-progress' | 'completed';
          is_serving_first: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          season_id?: string | null;
          event_id?: string | null;
          opponent_name?: string;
          date?: string;
          location?: string;
          status?: 'in-progress' | 'completed';
          is_serving_first?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          season_id?: string | null;
          event_id?: string | null;
          opponent_name?: string;
          date?: string;
          location?: string;
          status?: 'in-progress' | 'completed';
          is_serving_first?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
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
          server_jersey_number: number | null;
        };
        Insert: {
          id?: string;
          set_id: string;
          rally_number: number;
          point_won: boolean;
          server_jersey_number?: number | null;
        };
        Update: {
          id?: string;
          set_id?: string;
          rally_number?: number;
          point_won?: boolean;
          server_jersey_number?: number | null;
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
      sequences: {
        Row: {
          id: string;
          rally_id: string;
          sequence_number: number;
          is_serve: boolean;
        };
        Insert: {
          id?: string;
          rally_id: string;
          sequence_number: number;
          is_serve?: boolean;
        };
        Update: {
          id?: string;
          rally_id?: string;
          sequence_number?: number;
          is_serve?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'sequences_rally_id_fkey';
            columns: ['rally_id'];
            isOneToOne: false;
            referencedRelation: 'rallies';
            referencedColumns: ['id'];
          },
        ];
      };
      touches: {
        Row: {
          id: string;
          sequence_id: string;
          touch_number: number;
          type: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score: number;
          player_jersey_number: number;
        };
        Insert: {
          id?: string;
          sequence_id: string;
          touch_number: number;
          type: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score: number;
          player_jersey_number: number;
        };
        Update: {
          id?: string;
          sequence_id?: string;
          touch_number?: number;
          type?: 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';
          score?: number;
          player_jersey_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'touches_sequence_id_fkey';
            columns: ['sequence_id'];
            isOneToOne: false;
            referencedRelation: 'sequences';
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
      substitutions: {
        Row: {
          id: string;
          set_id: string;
          rally_number: number;
          player_out: number;
          player_in: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          rally_number: number;
          player_out: number;
          player_in: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          set_id?: string;
          rally_number?: number;
          player_out?: number;
          player_in?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'substitutions_set_id_fkey';
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
