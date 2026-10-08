-- =========================================================================
-- VSBH CricLeague / CricBid Play - Complete Supabase Setup & Migration
-- Paste and Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LEAGUES TABLE
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  budget NUMERIC DEFAULT 100,
  captain_name VARCHAR(255),
  captain_email VARCHAR(255),
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- 4. TEAM_PLAYERS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS public.team_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  sold_price NUMERIC NOT NULL,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- 5. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  match_number INTEGER,
  team1_id UUID REFERENCES public.teams(id),
  team2_id UUID REFERENCES public.teams(id),
  team1_name VARCHAR(255),
  team2_name VARCHAR(255),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  team1_wickets INTEGER DEFAULT 0,
  team2_wickets INTEGER DEFAULT 0,
  team1_overs NUMERIC DEFAULT 0,
  team2_overs NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'scheduled',
  stage VARCHAR(50) DEFAULT 'League',
  venue VARCHAR(255),
  match_date TIMESTAMP WITH TIME ZONE,
  result_text TEXT,
  winner_team_id UUID REFERENCES public.teams(id),
  man_of_match VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. AUCTION LOGS TABLE
CREATE TABLE IF NOT EXISTS public.auction_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  is_winning_bid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- PERMISSIVE RLS CONFIGURATION FOR PUBLISHABLE KEY ACCESS
-- =========================================================================

-- Disable RLS on tables so publishable key and backend can read and write freely
ALTER TABLE public.leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_logs DISABLE ROW LEVEL SECURITY;

-- If RLS is re-enabled in the future, these public policies grant full access
DO $$
BEGIN
  -- Leagues
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leagues' AND policyname = 'Allow public leagues access') THEN
    CREATE POLICY "Allow public leagues access" ON public.leagues FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Teams
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Allow public teams access') THEN
    CREATE POLICY "Allow public teams access" ON public.teams FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Players
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Allow public players access') THEN
    CREATE POLICY "Allow public players access" ON public.players FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Team_players
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_players' AND policyname = 'Allow public team_players access') THEN
    CREATE POLICY "Allow public team_players access" ON public.team_players FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Matches
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'matches' AND policyname = 'Allow public matches access') THEN
    CREATE POLICY "Allow public matches access" ON public.matches FOR ALL USING (true) WITH CHECK (true);
  END IF;
  -- Auction_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'auction_logs' AND policyname = 'Allow public auction_logs access') THEN
    CREATE POLICY "Allow public auction_logs access" ON public.auction_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Enable Supabase Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leagues;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.team_players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
