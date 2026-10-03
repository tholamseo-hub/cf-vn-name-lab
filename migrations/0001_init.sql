CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  attachment_key TEXT,
  attachment_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
