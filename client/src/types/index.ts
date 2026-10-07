export interface League {
  id: string;
  name: string;
  code: string;
  admin_name?: string;
  admin_email: string;
  number_of_teams: number;
  registration_deadline?: string;
  registration_status: 'open' | 'closed';
  auction_date_time?: string;
  captain_auction_key?: string;
  auction_status: 'draft' | 'scheduled' | 'live' | 'completed';
  created_at: string;
}

export interface Player {
  id: string;
  league_id?: string;
  name: string;
  role: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper';
  department: string;
  college_id: string;
  year: string;
  is_mvp: boolean;
  is_available?: boolean;
  base_price: number;
  sold_price?: number | null;
  sold_to_team?: string | null;
  status: 'available' | 'sold' | 'unsold';
  created_at: string;
  sold_at?: string;
  email?: string;
  phone?: string;
  batting_hand?: 'right' | 'left';
  batting_position?: 'opener' | 'top-order' | 'middle-order' | 'finisher' | 'wk-batter';
  bowling_arm?: 'right' | 'left';
  bowling_category?: 'pace' | 'spin';
  bowling_type?: string;
  allrounder_type?: 'batting-allrounder' | 'bowling-allrounder';
  is_wicketkeeper?: boolean;
  experience_level?: string;
  jersey_number?: number | string;
  special_skills?: string;
}

export interface Team {
  id: string;
  league_id?: string;
  name: string;
  budget: number;
  captain_name?: string;
  captain_email?: string;
  logo: string;
  created_at: string;
  team_players?: TeamPlayer[];
}

export interface TeamPlayer {
  id: string;
  league_id?: string;
  team_id: string;
  player_id: string;
  sold_price: number;
  college_id?: string;
  picked_by?: string;
  picked_at?: string;
  created_at?: string;
  players?: Player;
  player?: Player;
}

export interface AuctionState {
  id?: number;
  league_id?: string;
  current_player_id?: string | null;
  current_team_id?: string | null;
  current_bid: number;
  timer_seconds: number;
  is_active: boolean;
  auction_round: number;
  updated_at: string;
  currentPlayer?: Player | null;
  currentTeam?: Team | null;
}

export interface MatchCommentaryItem {
  id: string;
  over: string;
  text: string;
  runs: number;
  isWicket: boolean;
  timestamp: string;
}

export interface Match {
  id: string;
  league_id: string;
  team1_id: string;
  team2_id: string;
  team1_name?: string;
  team2_name?: string;
  team1_score: number;
  team2_score: number;
  team1_wickets: number;
  team2_wickets: number;
  team1_overs: string | number;
  team2_overs: string | number;
  target?: number | null;
  current_batting_team_id?: string;
  status: 'upcoming' | 'live' | 'finished';
  match_date: string;
  venue: string;
  group_stage?: string;
  current_striker?: string;
  current_non_striker?: string;
  current_bowler?: string;
  recent_balls?: string[];
  commentary?: MatchCommentaryItem[];
  play_documentation?: string; // Dedicated live play documentation editable only by league admin
  created_at: string;
  updated_at?: string;
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
  role: 'admin' | 'captain' | 'player' | 'viewer';
  leagueId?: string;
  leagueName?: string;
  teamId?: string;
  created_at?: string;
}
