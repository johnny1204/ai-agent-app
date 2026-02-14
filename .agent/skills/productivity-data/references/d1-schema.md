# D1 スキーマ設計

## テーブル一覧

| テーブル | 用途 |
|----------|------|
| `commits` | GitHubコミットデータ |
| `pull_requests` | GitHubプルリクエスト |
| `issues` | GitHub Issue |
| `tasks` | Notionタスクデータ |
| `daily_summary` | 日次集計サマリー |
| `sync_log` | 同期ログ（最終取得日時等） |

## マイグレーションSQL

### 0001_init.sql

```sql
-- コミットテーブル
CREATE TABLE IF NOT EXISTS commits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sha TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  author TEXT NOT NULL,
  repo TEXT NOT NULL,
  committed_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_commits_repo ON commits(repo);
CREATE INDEX idx_commits_date ON commits(committed_at);
CREATE INDEX idx_commits_author ON commits(author);

-- プルリクエストテーブル
CREATE TABLE IF NOT EXISTS pull_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL UNIQUE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,          -- 'open', 'closed', 'merged'
  author TEXT NOT NULL,
  repo TEXT NOT NULL,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  merged_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_pr_repo ON pull_requests(repo);
CREATE INDEX idx_pr_state ON pull_requests(state);
CREATE INDEX idx_pr_date ON pull_requests(created_at);

-- Issueテーブル
CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER NOT NULL UNIQUE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,          -- 'open', 'closed'
  author TEXT NOT NULL,
  repo TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_issues_repo ON issues(repo);
CREATE INDEX idx_issues_state ON issues(state);

-- Notionタスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notion_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT,                  -- 'Not Started', 'In Progress', 'Done' 等
  assignee TEXT,
  due_date TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_date ON tasks(due_date);

-- 日次サマリーテーブル
CREATE TABLE IF NOT EXISTS daily_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  commits_count INTEGER DEFAULT 0,
  prs_opened INTEGER DEFAULT 0,
  prs_merged INTEGER DEFAULT 0,
  issues_opened INTEGER DEFAULT 0,
  issues_closed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_summary_date ON daily_summary(date);

-- 同期ログ
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,         -- 'github', 'notion'
  last_synced_at TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success', -- 'success', 'error'
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## 便利クエリ集

### 日別コミット数

```sql
SELECT DATE(committed_at) as date, COUNT(*) as count
FROM commits
WHERE committed_at >= ? AND committed_at < ?
GROUP BY DATE(committed_at)
ORDER BY date;
```

### リポジトリ別コミット数

```sql
SELECT repo, COUNT(*) as count
FROM commits
WHERE committed_at >= ?
GROUP BY repo
ORDER BY count DESC;
```

### タスクステータス別集計

```sql
SELECT status, COUNT(*) as count
FROM tasks
GROUP BY status;
```

### 週次生産性サマリー

```sql
SELECT
  strftime('%Y-W%W', date) as week,
  SUM(commits_count) as total_commits,
  SUM(prs_merged) as total_prs_merged,
  SUM(tasks_completed) as total_tasks_completed
FROM daily_summary
WHERE date >= ?
GROUP BY week
ORDER BY week;
```

### 日次サマリー生成（Cron内で使用）

```sql
INSERT OR REPLACE INTO daily_summary (date, commits_count, prs_opened, prs_merged, issues_opened, issues_closed, tasks_completed)
VALUES (
  ?,
  (SELECT COUNT(*) FROM commits WHERE DATE(committed_at) = ?),
  (SELECT COUNT(*) FROM pull_requests WHERE DATE(created_at) = ?),
  (SELECT COUNT(*) FROM pull_requests WHERE DATE(merged_at) = ?),
  (SELECT COUNT(*) FROM issues WHERE DATE(created_at) = ?),
  (SELECT COUNT(*) FROM issues WHERE DATE(closed_at) = ?),
  (SELECT COUNT(*) FROM tasks WHERE DATE(completed_at) = ?)
);
```
