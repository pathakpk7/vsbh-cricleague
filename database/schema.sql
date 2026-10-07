-- VSBH-CL Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication and user management)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'team_manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table (Multi-organization support)
CREATE TABLE leagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  admin_name VARCHAR(255),
  admin_email VARCHAR(255) NOT NULL,
  admin_password VARCHAR(255),
  number_of_teams INTEGER DEFAULT 6,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  registration_status VARCHAR(50) DEFAULT 'open' CHECK (registration_status IN ('open', 'closed')),
  auction_date_time TIMESTAMP WITH TIME ZONE,
  captain_auction_key VARCHAR(100),
  auction_status VARCHAR(50) DEFAULT 'draft' CHECK (auction_status IN ('draft', 'scheduled', 'live', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  budget INTEGER DEFAULT 100,
  captain_name VARCHAR(255),
  captain_email VARCHAR(255),
  logo VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('batter', 'bowler', 'all-rounder', 'wicketkeeper')),
  department VARCHAR(255),
  college_id VARCHAR(100),
  year VARCHAR(20),
  is_mvp BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  base_price INTEGER DEFAULT 10,
  sold_price INTEGER,
  sold_to_team UUID REFERENCES teams(id),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'sold', 'unsold')),
  email VARCHAR(255),
  phone VARCHAR(20),
  batting_hand VARCHAR(20) CHECK (batting_hand IN ('right', 'left')),
  batting_position VARCHAR(50) CHECK (batting_position IN ('opener', 'top-order', 'middle-order', 'finisher', 'wk-batter')),
  bowling_arm VARCHAR(20) CHECK (bowling_arm IN ('right', 'left')),
  bowling_category VARCHAR(20) CHECK (bowling_category IN ('pace', 'spin')),
  bowling_type VARCHAR(50),
  allrounder_type VARCHAR(50) CHECK (allrounder_type IN ('batting-allrounder', 'bowling-allrounder')),
  is_wicketkeeper BOOLEAN DEFAULT false,
  experience_level VARCHAR(50),
  jersey_number INTEGER,
  special_skills TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_at TIMESTAMP WITH TIME ZONE
);

-- Team_players junction table
CREATE TABLE team_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  sold_price INTEGER NOT NULL,
  picked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Matches table (with dedicated live scoring and play documentation)
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  team1_id UUID REFERENCES teams(id),
  team2_id UUID REFERENCES teams(id),
  team1_name VARCHAR(255),
  team2_name VARCHAR(255),
  team1_score INTEGER DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  team1_wickets INTEGER DEFAULT 0,
  team2_wickets INTEGER DEFAULT 0,
  team1_overs VARCHAR(10) DEFAULT '0.0',
  team2_overs VARCHAR(10) DEFAULT '0.0',
  target INTEGER,
  current_batting_team_id UUID REFERENCES teams(id),
  status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
  match_date TIMESTAMP WITH TIME ZONE,
  venue VARCHAR(255),
  group_stage VARCHAR(50),
  current_striker VARCHAR(255),
  current_non_striker VARCHAR(255),
  current_bowler VARCHAR(255),
  recent_balls JSONB DEFAULT '[]'::jsonb,
  commentary JSONB DEFAULT '[]'::jsonb,
  play_documentation TEXT, -- Dedicated live play documentation editable only by league admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points table
CREATE TABLE points_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) UNIQUE,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  net_run_rate DECIMAL(5,3) DEFAULT 0.000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction state table
CREATE TABLE auction_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_player_id UUID REFERENCES players(id),
  current_team_id UUID REFERENCES teams(id),
  current_bid INTEGER DEFAULT 10,
  timer_seconds INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT false,
  auction_round INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial auction state
INSERT INTO auction_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Pending players table (for Google Sheets sync)
CREATE TABLE pending_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  department VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  google_sheets_row_id INTEGER,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_sold_to_team ON players(sold_to_team);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_points_table_team_id ON points_table(team_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_points_table_updated_at BEFORE UPDATE ON points_table FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_players ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust as needed for your security requirements)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can view team_players" ON team_players FOR SELECT USING (true);
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Anyone can view points_table" ON points_table FOR SELECT USING (true);
CREATE POLICY "Anyone can view auction_state" ON auction_state FOR SELECT USING (true);

-- Admin policies (you may want to create a more sophisticated role-based system)
CREATE POLICY "Admins can insert teams" ON teams FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update teams" ON teams FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete teams" ON teams FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert players" ON players FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update players" ON players FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete players" ON players FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert matches" ON matches FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can update matches" ON matches FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete matches" ON matches FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update auction_state" ON auction_state FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can insert team_players" ON team_players FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can delete team_players" ON team_players FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_players;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE points_table;
ALTER PUBLICATION supabase_realtime ADD TABLE auction_state;
