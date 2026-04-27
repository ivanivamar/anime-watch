CREATE TABLE shows (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  poster_path TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE episodes (
  id INTEGER PRIMARY KEY,
  show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  episode INTEGER NOT NULL,
  title TEXT,
  file_path TEXT NOT NULL UNIQUE,
  duration_seconds INTEGER,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(show_id, season, episode)
);

CREATE TABLE watch_progress (
  episode_id INTEGER PRIMARY KEY REFERENCES episodes(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_episodes_show ON episodes(show_id, season, episode);
