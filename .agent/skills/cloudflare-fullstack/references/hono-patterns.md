# Hono on Cloudflare Workers パターン集

## 基本セットアップ

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

type Env = {
  Bindings: {
    DB: D1Database;
    GITHUB_TOKEN: string;
    NOTION_TOKEN: string;
  };
};

const app = new Hono<Env>();

// ミドルウェア
app.use('*', logger());
app.use('/api/*', cors());

export default app;
```

## ルーティングパターン

### APIルートのグループ化

```typescript
// src/server/routes/commits.ts
import { Hono } from 'hono';

const commits = new Hono<Env>();

commits.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM commits ORDER BY committed_at DESC LIMIT 50'
  ).all();
  return c.json({ data: results });
});

commits.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare(
    'SELECT * FROM commits WHERE id = ?'
  ).bind(id).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: result });
});

export default commits;
```

### ルート統合

```typescript
// src/server/index.ts
import { Hono } from 'hono';
import commits from './routes/commits';
import tasks from './routes/tasks';
import summary from './routes/summary';

const app = new Hono<Env>();

app.route('/api/commits', commits);
app.route('/api/tasks', tasks);
app.route('/api/summary', summary);

export default app;
```

## D1 アクセスパターン

### SELECT（複数行）

```typescript
const { results } = await c.env.DB.prepare(
  'SELECT * FROM commits WHERE repo = ? ORDER BY committed_at DESC LIMIT ?'
).bind(repo, limit).all();
```

### SELECT（1行）

```typescript
const row = await c.env.DB.prepare(
  'SELECT COUNT(*) as count FROM commits WHERE repo = ?'
).bind(repo).first();
```

### INSERT

```typescript
await c.env.DB.prepare(
  'INSERT OR IGNORE INTO commits (sha, message, author, repo, committed_at) VALUES (?, ?, ?, ?, ?)'
).bind(sha, message, author, repo, committedAt).run();
```

### バッチINSERT

```typescript
const stmt = c.env.DB.prepare(
  'INSERT OR IGNORE INTO commits (sha, message, author, repo, committed_at) VALUES (?, ?, ?, ?, ?)'
);
const batch = commits.map((c) =>
  stmt.bind(c.sha, c.message, c.author, c.repo, c.committed_at)
);
await c.env.DB.batch(batch);
```

### 日付範囲クエリ

```typescript
const { results } = await c.env.DB.prepare(`
  SELECT DATE(committed_at) as date, COUNT(*) as count
  FROM commits
  WHERE committed_at >= ? AND committed_at < ?
  GROUP BY DATE(committed_at)
  ORDER BY date
`).bind(startDate, endDate).all();
```

## ミドルウェアパターン

### エラーハンドリング

```typescript
app.onError((err, c) => {
  console.error('Error:', err.message);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

### クエリパラメータバリデーション

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  repo: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

commits.get('/', zValidator('query', querySchema), async (c) => {
  const { from, to, repo, limit } = c.req.valid('query');
  // ...
});
```

## Next.js + Hono 統合パターン

### Next.js API Routes からHonoを使用

```typescript
// src/app/api/[...route]/route.ts
import { handle } from 'hono/vercel';
import app from '@/server';

export const GET = handle(app);
export const POST = handle(app);
```

### フロントエンドからのAPI呼び出し

```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchCommits(params?: {
  repo?: string;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${API_BASE}/api/commits?${query}`);
  if (!res.ok) throw new Error('Failed to fetch commits');
  return res.json();
}
```

## Cron Worker + Hono 統合

```typescript
// src/server/index.ts
import { Hono } from 'hono';

const app = new Hono<Env>();

// APIルート
app.route('/api/commits', commits);

// Cron Handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env['Bindings'], ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env, event.cron));
  },
};

async function handleScheduled(env: Env['Bindings'], cron: string) {
  switch (cron) {
    case '0 0 * * *':
      await fetchGitHubData(env);
      break;
    case '0 */6 * * *':
      await fetchNotionData(env);
      break;
  }
}
```
