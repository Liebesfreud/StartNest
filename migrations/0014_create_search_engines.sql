CREATE TABLE IF NOT EXISTS search_engines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url_template TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_engines_sort_order ON search_engines(sort_order);
