# wrangler.jsonc 設定ガイド

## 基本構成

```jsonc
{
  "name": "my-app",
  "compatibility_date": "2026-01-22",
  "main": "src/server/index.ts",

  // D1 データベースバインディング
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-database",
      "database_id": "<database-id>"
    }
  ],

  // Cron Triggers
  "triggers": {
    "crons": [
      "0 0 * * *",     // 毎日0:00 UTC
      "0 */6 * * *",   // 6時間ごと
      "*/30 * * * *"   // 30分ごと
    ]
  },

  // 静的アセット（Pagesの場合）
  "assets": {
    "directory": "./out"
  },

  // 環境変数（非機密）
  "vars": {
    "ENVIRONMENT": "production"
  }
}
```

## シークレット管理

```bash
# シークレット設定（APIトークン等の機密情報）
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put NOTION_TOKEN

# ローカル開発用: .dev.vars ファイル（.gitignoreに追加すること）
# GITHUB_TOKEN=ghp_xxxxx
# NOTION_TOKEN=ntn_xxxxx
```

## 開発 vs 本番環境

```jsonc
{
  "name": "my-app",
  "main": "src/server/index.ts",

  // 開発環境
  "env": {
    "staging": {
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "my-database-staging",
          "database_id": "<staging-db-id>"
        }
      ],
      "vars": { "ENVIRONMENT": "staging" }
    }
  }
}
```

## D1 マイグレーション

```bash
# マイグレーションフォルダ（デフォルト: migrations/）
npx wrangler d1 migrations create my-database init
# → migrations/0001_init.sql が生成される

# ローカルDB適用
npx wrangler d1 migrations apply my-database --local

# リモートDB適用（本番）
npx wrangler d1 migrations apply my-database --remote
```

マイグレーションSQL例:

```sql
-- 0001_init.sql
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
```

## Cron Triggers 詳細設定

cron式の形式: `分 時 日 月 曜日`

| パターン | 説明 |
|----------|------|
| `0 0 * * *` | 毎日0:00 UTC |
| `0 9 * * 1` | 毎週月曜9:00 UTC |
| `0 */6 * * *` | 6時間ごと |
| `*/30 * * * *` | 30分ごと |
| `0 0 1 * *` | 毎月1日0:00 UTC |

> **注意**: Cron TriggersはUTC基準。JST (UTC+9) で毎朝6時に実行したい場合は `0 21 * * *`（前日21:00 UTC）を指定する。
