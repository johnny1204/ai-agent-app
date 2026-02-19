-- 書籍テーブル
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'unread',  -- 'unread', 'reading', 'finished', 'practicing'
  is_public INTEGER NOT NULL DEFAULT 0,   -- 0: 非公開, 1: 公開
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_public ON books(is_public);

-- 読書メモテーブル
CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  category TEXT NOT NULL,                 -- 'claim', 'insight', 'action'
  content TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX idx_memos_book ON memos(book_id);
CREATE INDEX idx_memos_category ON memos(category);

-- タグマスタ
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 書籍×タグ中間テーブル
CREATE TABLE IF NOT EXISTS book_tags (
  book_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (book_id, tag_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
