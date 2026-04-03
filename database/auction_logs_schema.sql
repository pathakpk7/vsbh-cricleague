-- Create auction_logs table to track all bidding activity
CREATE TABLE IF NOT EXISTS auction_logs (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    bid_amount INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_winning_bid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE auction_logs 
ADD CONSTRAINT fk_auction_logs_player 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

ALTER TABLE auction_logs 
ADD CONSTRAINT fk_auction_logs_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_logs_player_id ON auction_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_team_id ON auction_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_logs_timestamp ON auction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_auction_logs_is_winning_bid ON auction_logs(is_winning_bid);

-- Add comments for documentation
COMMENT ON TABLE auction_logs IS 'Tracks all bidding activity during auction';
COMMENT ON COLUMN auction_logs.id IS 'Unique identifier for each log entry';
COMMENT ON COLUMN auction_logs.player_id IS 'Reference to the player being bid on';
COMMENT ON COLUMN auction_logs.team_id IS 'Reference to the team placing the bid';
COMMENT ON COLUMN auction_logs.bid_amount IS 'Amount of the bid placed';
COMMENT ON COLUMN auction_logs.timestamp IS 'When the bid was placed';
COMMENT ON COLUMN auction_logs.is_winning_bid IS 'Whether this was the final winning bid';
COMMENT ON COLUMN auction_logs.created_at IS 'Record creation timestamp';
