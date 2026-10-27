CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'SEA',
  update_at TEXT,
  version TEXT,
  notes TEXT,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_status TEXT NOT NULL DEFAULT 'pending',
  source_message TEXT,
  patch_url TEXT,
  checked_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_region ON games(region);
CREATE INDEX IF NOT EXISTS idx_games_update_at ON games(update_at);
