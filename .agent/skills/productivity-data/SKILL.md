---
name: productivity-data
description: 生産性データの取得・蓄積・提供パイプライン構築ガイド。GitHub API、Notion APIからのデータ取得、Cloudflare D1スキーマ設計、Cron Triggersによる定期取得、Hono APIエンドポイント設計に使用する。データパイプライン、スキーマ設計、外部API連携時にトリガーする。
---

# 生産性データパイプライン構築ガイド

GitHub/Notion からデータを定期取得し、D1に蓄積、APIで提供するパイプラインの構築ガイド。

## データフロー

```
[GitHub API] ──→ [Cron Worker] ──→ [D1] ──→ [Hono API] ──→ [Dashboard]
[Notion API] ──→ [Cron Worker] ──→ [D1] ──→ [Hono API] ──→ [Dashboard]
```

## D1 スキーマ設計

テーブル定義、マイグレーション、インデックス設計は [d1-schema.md](references/d1-schema.md) を参照。

## GitHub API データ取得

コミット・PR・Issue・レビューの取得パターンは [github-api.md](references/github-api.md) を参照。

## Notion API データ取得

データベースクエリ・タスク取得パターンは [notion-api.md](references/notion-api.md) を参照。

## Cron Worker 実装パターン

```typescript
async function fetchAndStoreGitHubData(env: Env) {
  const repos = ['owner/repo1', 'owner/repo2'];

  for (const repo of repos) {
    // 最新の取得済みコミット日時を取得
    const latest = await env.DB.prepare(
      'SELECT MAX(committed_at) as last FROM commits WHERE repo = ?'
    ).bind(repo).first<{ last: string | null }>();

    const since = latest?.last || '2024-01-01T00:00:00Z';

    // GitHub APIから新しいコミットを取得
    const commits = await fetchCommits(env.GITHUB_TOKEN, repo, since);

    // D1にバッチINSERT
    if (commits.length > 0) {
      const stmt = env.DB.prepare(
        'INSERT OR IGNORE INTO commits (sha, message, author, repo, committed_at) VALUES (?, ?, ?, ?, ?)'
      );
      await env.DB.batch(
        commits.map((c) => stmt.bind(c.sha, c.message, c.author, repo, c.date))
      );
    }
  }
}
```

## API エンドポイント設計

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/commits` | コミット一覧（フィルタ: repo, from, to） |
| GET | `/api/commits/stats` | コミット統計（日別・週別集計） |
| GET | `/api/tasks` | タスク一覧（フィルタ: status, from, to） |
| GET | `/api/tasks/stats` | タスク統計（ステータス別集計） |
| GET | `/api/summary/daily` | 日次サマリー（KPI用） |
| GET | `/api/summary/weekly` | 週次サマリー |

## レスポンスフォーマット

```typescript
// 統一レスポンス形式
type ApiResponse<T> = {
  data: T;
  meta?: {
    total: number;
    from?: string;
    to?: string;
  };
};
```
