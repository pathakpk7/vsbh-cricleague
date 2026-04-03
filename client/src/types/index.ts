export interface Player {
  id: string;
  name: string;
  role: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  department: string;
  college_id: string; // Added college ID for authentication
  year: string; // Academic year
  is_mvp: boolean; // MVP status
  base_price: number;
  sold_price?: number;
  sold_to_team?: string;
  status: 'available' | 'sold' | 'unsold';
  created_at: string;
  sold_at?: string;
  email?: string;
  phone?: string;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  logo: string;
  created_at: string;
  team_players?: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  sold_price: number;
  college_id: string; // Track which college ID picked this player
  picked_by: string; // Track who picked the player (team manager name)
  picked_at: string; // Track when player was picked
  created_at: string;
  players?: Player;
}

export interface AuctionState {
  id: number;
  current_player_id?: string;
  current_team_id?: string;
  current_bid: number;
  timer_seconds: number;
  is_active: boolean;
  auction_round: number;
  updated_at: string;
}

export interface Match {
  id: string;
  team1_id: string;
  team2_id: string;
  team1_score?: number;
  team2_score?: number;
  team1_wickets?: number;
  team2_wickets?: number;
  team1_overs?: number;
  team2_overs?: number;
  status: 'upcoming' | 'live' | 'finished';
  match_date: string;
  venue: string;
  group_stage?: 'A' | 'B' | 'semi-final' | 'final';
  created_at: string;
}

export interface PointsTable {
  id: string;
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  net_run_rate: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'team_manager' | 'viewer';
  created_at: string;
}
