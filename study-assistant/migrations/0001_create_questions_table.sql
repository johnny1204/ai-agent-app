CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  options TEXT NOT NULL, -- Stored as JSON array string
  correctAnswer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
