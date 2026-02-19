# D1 スキーマ設計

## テーブル一覧

| テーブル | 用途 |
|----------|------|
| `books` | 書籍基本情報 |
| `memos` | 読書メモ（構造化済み） |
| `tags` | タグマスタ |
| `book_tags` | books × tags 中間テーブル |

## マイグレーションSQL

### 0001_init.sql

```sql
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
```

## カテゴリ定義

| category 値 | 表示名 | 説明 |
|-------------|--------|------|
| `claim` | 著者の主張 | 本に書かれている主張・論点 |
| `insight` | 自分の洞察 | 読んで得た気づき・解釈 |
| `action` | 具体アクション | 実際に行動に移すこと |

## 便利クエリ集

### 書籍一覧（公開のみ、タグ付き）

```sql
SELECT b.*, GROUP_CONCAT(t.name) as tags
FROM books b
LEFT JOIN book_tags bt ON b.id = bt.book_id
LEFT JOIN tags t ON bt.tag_id = t.id
WHERE b.is_public = 1
GROUP BY b.id
ORDER BY b.updated_at DESC;
```

### 書籍詳細（メモ含む）

```sql
SELECT * FROM books WHERE id = ?;

SELECT * FROM memos
WHERE book_id = ? AND is_public = ?
ORDER BY category, created_at;
```

### タグ検索

```sql
SELECT DISTINCT b.*
FROM books b
JOIN book_tags bt ON b.id = bt.book_id
JOIN tags t ON bt.tag_id = t.id
WHERE t.name = ? AND b.is_public = 1;
```

### ステータス別集計

```sql
SELECT status, COUNT(*) as count
FROM books
GROUP BY status;
```

### タグ一覧（使用数付き）

```sql
SELECT t.name, COUNT(bt.book_id) as book_count
FROM tags t
LEFT JOIN book_tags bt ON t.id = bt.tag_id
GROUP BY t.id
ORDER BY book_count DESC;
```
