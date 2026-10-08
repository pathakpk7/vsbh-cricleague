-- =========================================================================
-- PitchBid Pro / CricLeague - Complete Supabase Setup & Schema Fix
-- Paste and Run this in your Supabase Dashboard:
-- Supabase Dashboard -> SQL Editor -> New query -> Paste All -> Click RUN
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables cleanly to fix missing columns and broken RLS constraints
DROP TABLE IF EXISTS public.team_players CASCADE;
DROP TABLE IF EXISTS public.auction_logs CASCADE;
DROP TABLE IF EXISTS public.auction_state CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;

-- 3. Leagues Table
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  admin_name VARCHAR(255),
  admin_email VARCHAR(255) NOT NULL,
  admin_password VARCHAR(255),
  number_of_teams INTEGER DEFAULT 6,
  default_team_purse NUMERIC DEFAULT 100,
  max_players_per_team INTEGER DEFAULT 15,
  registration_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registration_deadline TIMESTAMP WITH TIME ZONE,
  registration_status VARCHAR(50) DEFAULT 'open',
  auction_date_time TIMESTAMP WITH TIME ZONE,
  captain_auction_key VARCHAR(100),
  auction_status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Teams Table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  budget NUMERIC DEFAULT 100,
  captain_name VARCHAR(255),
  captain_email VARCHAR(255),
  captain_code VARCHAR(100),
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Players Table (with ALL registration fields)
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'batter',
  department VARCHAR(255),
  college_id VARCHAR(100),
  year VARCHAR(50),
  base_price NUMERIC DEFAULT 10,
  sold_price NUMERIC,
  sold_to_team UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'available',
  is_mvp BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  password VARCHAR(255) DEFAULT 'player123',
  batting_hand VARCHAR(50) DEFAULT 'right',
  batting_position VARCHAR(50),
  bowling_arm VARCHAR(50),
  bowling_category VARCHAR(50),
  bowling_type VARCHAR(100),
  allrounder_type VARCHAR(100),
  is_wicketkeeper BOOLEAN DEFAULT false,
  experience_level VARCHAR(100),
  jersey_number INTEGER,
  special_skills TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Team Players Junction Table
CREATE TABLE public.team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  sold_price NUMERIC NOT NULL,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 7. Matches Table (with live scorecard and commentary)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  match_number INTEGER,
  team1_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team2_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team1_name VARCHAR(255),
  team2_name VARCHAR(255),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  team1_wickets INTEGER DEFAULT 0,
  team2_wickets INTEGER DEFAULT 0,
  team1_overs NUMERIC DEFAULT 0,
  team2_overs NUMERIC DEFAULT 0,
  target INTEGER,
  current_batting_team_id UUID,
  status VARCHAR(50) DEFAULT 'scheduled',
  stage VARCHAR(50) DEFAULT 'League',
  venue VARCHAR(255) DEFAULT 'Campus Ground',
  match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  result_text TEXT,
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  man_of_match VARCHAR(255),
  current_striker VARCHAR(255),
  current_non_striker VARCHAR(255),
  current_bowler VARCHAR(255),
  recent_balls JSONB DEFAULT '[]'::jsonb,
  commentary JSONB DEFAULT '[]'::jsonb,
  play_documentation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Auction State Table
CREATE TABLE public.auction_state (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  current_player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  current_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  current_bid NUMERIC DEFAULT 10,
  timer_seconds INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT false,
  auction_round INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Auction Logs Table
CREATE TABLE public.auction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  bid_amount NUMERIC NOT NULL,
  is_winning_bid BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Disable Row-Level Security (RLS) on all tables for public API Key
ALTER TABLE public.leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_logs DISABLE ROW LEVEL SECURITY;

-- 11. Create Permissive Policies FOR ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- In case RLS is re-enabled on Supabase, these guarantee SELECT is NEVER blocked!
DROP POLICY IF EXISTS "Public full access leagues" ON public.leagues;
CREATE POLICY "Public full access leagues" ON public.leagues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access teams" ON public.teams;
CREATE POLICY "Public full access teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access players" ON public.players;
CREATE POLICY "Public full access players" ON public.players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access team_players" ON public.team_players;
CREATE POLICY "Public full access team_players" ON public.team_players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access matches" ON public.matches;
CREATE POLICY "Public full access matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access auction_state" ON public.auction_state;
CREATE POLICY "Public full access auction_state" ON public.auction_state FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access auction_logs" ON public.auction_logs;
CREATE POLICY "Public full access auction_logs" ON public.auction_logs FOR ALL USING (true) WITH CHECK (true);

-- 12. Add tables to Supabase Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_players;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_logs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_state;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
