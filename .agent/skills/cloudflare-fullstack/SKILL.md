---
name: cloudflare-fullstack
description: Cloudflare Workers + D1 + Pages + Honoを使ったフルスタックアプリケーション構築ガイド。プロジェクトの初期セットアップ、wrangler設定、D1データベースの作成・マイグレーション、Honoルーティング、Cron Triggers設定、Cloudflare Pagesデプロイに使用する。Next.jsとの組み合わせ、ローカル開発環境構築にも対応。
---

# Cloudflare Fullstack 開発ガイド

Cloudflare Workers + D1 + Pages + Hono で構築するフルスタックアプリケーションの開発ガイド。

## プロジェクト構造

```
project-root/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── dashboard/
│   ├── server/           # Hono Backend
│   │   ├── index.ts      # Hono app エントリポイント
│   │   ├── routes/       # APIルート定義
│   │   ├── middleware/   # 共通ミドルウェア
│   │   └── db/           # D1アクセスヘルパー
│   └── shared/           # フロント/バック共有型定義
├── workers/
│   └── cron/             # Cron Trigger Workers
├── migrations/           # D1マイグレーションSQL
├── wrangler.jsonc
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 開発ワークフロー

### 1. プロジェクト初期化

```bash
npx -y create-next-app@latest ./ --typescript --app --eslint --src-dir --no-tailwind --import-alias "@/*"
npm install hono
npm install -D wrangler @cloudflare/next-on-pages
```

### 2. wrangler.jsonc 設定

D1バインディング、Cron Triggers、環境変数の設定は [wrangler-guide.md](references/wrangler-guide.md) を参照。

### 3. Hono バックエンド構築

ルーティング、ミドルウェア、D1アクセスパターンは [hono-patterns.md](references/hono-patterns.md) を参照。

### 4. D1 データベース操作

```bash
# DB作成
npx wrangler d1 create <database-name>

# マイグレーション作成・適用
npx wrangler d1 migrations create <database-name> <migration-name>
npx wrangler d1 migrations apply <database-name> --local
npx wrangler d1 migrations apply <database-name> --remote
```

### 5. ローカル開発

```bash
npx wrangler dev              # Workers ローカル
npm run dev                    # Next.js ローカル
npx wrangler d1 execute <db> --local --command "SELECT * FROM table"
```

### 6. デプロイ

```bash
npx wrangler deploy            # Workers
npx wrangler pages deploy      # Pages (Next.js)
```

## Cron Triggers 基本パターン

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleCron(env));
  },
} satisfies ExportedHandler<Env>;
```

wrangler.jsonc:
```jsonc
{ "triggers": { "crons": ["0 0 * * *"] } }
```

## 環境バインディング型定義

```typescript
type Env = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  NOTION_TOKEN: string;
};
```
