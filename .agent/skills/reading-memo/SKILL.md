---
name: reading-memo
description: Reading Memo Bookshelf アプリの構築・運用ガイド。Next.js (App Router) + Tailwind CSS + Cloudflare D1 で読書メモ管理アプリを構築する際に使用する。書籍登録、メモの構造化入力（著者の主張・自分の洞察・具体アクション）、公開/非公開制御、タグ検索機能の実装時にトリガーする。
---

# Reading Memo Bookshelf 構築ガイド

Next.js (App Router) + Tailwind CSS + Cloudflare D1 で構築する読書メモ管理アプリのガイド。

## プロジェクト構造

```
bookshelf/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # 本棚一覧（公開ビュー）
│   │   ├── books/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # 書籍詳細
│   │   │   └── new/
│   │   │       └── page.tsx    # 書籍登録
│   │   ├── admin/              # 管理者専用（ログイン後）
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # 管理ダッシュボード
│   │   │   └── books/
│   │   │       └── [id]/
│   │   │           └── edit/
│   │   │               └── page.tsx
│   │   └── api/                # Route Handlers
│   │       ├── books/
│   │       │   ├── route.ts    # GET(一覧) / POST(登録)
│   │       │   └── [id]/
│   │       │       └── route.ts # GET / PUT / DELETE
│   │       ├── memos/
│   │       │   └── route.ts
│   │       └── tags/
│   │           └── route.ts
│   ├── components/
│   │   ├── BookCard.tsx        # 書籍カード
│   │   ├── BookGrid.tsx        # カードグリッド
│   │   ├── BookForm.tsx        # 登録・編集フォーム
│   │   ├── MemoEditor.tsx      # メモ入力（3分類）
│   │   ├── MemoDisplay.tsx     # メモ構造化表示
│   │   ├── StatusBadge.tsx     # ステータスバッジ
│   │   ├── TagFilter.tsx       # タグフィルタ
│   │   └── Header.tsx          # 共通ヘッダー
│   ├── lib/
│   │   ├── db.ts               # D1ヘルパー
│   │   ├── api.ts              # APIクライアント
│   │   └── types.ts            # 型定義
│   └── styles/
│       └── globals.css         # Tailwind + カスタムスタイル
├── migrations/                 # D1マイグレーション
│   └── 0001_init.sql
├── wrangler.jsonc
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

## 開発ワークフロー

### 1. プロジェクト初期化

```bash
npx -y create-next-app@latest bookshelf/ --typescript --app --eslint --src-dir --tailwind --import-alias "@/*"
cd bookshelf
npm install -D wrangler @cloudflare/next-on-pages
```

### 2. D1 データベース構築

```bash
# DB作成
npx wrangler d1 create reading-bookshelf

# マイグレーション作成・適用
npx wrangler d1 migrations create reading-bookshelf init
npx wrangler d1 migrations apply reading-bookshelf --local
```

テーブル設計の詳細は [schema-design.md](references/schema-design.md) を参照。

### 3. UI コンポーネント実装

本棚UI、書籍カード、メモエディタ等のコンポーネント設計は [ui-patterns.md](references/ui-patterns.md) を参照。

### 4. ローカル開発

```bash
npm run dev                    # Next.js 開発サーバー
npx wrangler d1 execute reading-bookshelf --local --command "SELECT * FROM books"
```

### 5. デプロイ

```bash
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

## データモデル概要

| テーブル | 用途 |
|----------|------|
| `books` | 書籍情報（タイトル、著者、ISBN、ステータス、公開フラグ） |
| `memos` | 読書メモ（カテゴリ: claim/insight/action） |
| `tags` | タグマスタ |
| `book_tags` | books × tags 中間テーブル |

## ステータス定義

| 値 | 表示名 | 説明 |
|----|--------|------|
| `unread` | 積読 | 購入済み・未読 |
| `reading` | 読書中 | 現在読んでいる |
| `finished` | 読了 | 読み終えた |
| `practicing` | 実践中 | 内容を実践に移している |

## 公開・非公開レイヤー

| レイヤー | 表示内容 | アクセス |
|----------|----------|----------|
| Public | 書籍基本情報、タグ、ステータス | 誰でも閲覧可能 |
| Private | 生のメモ、個人的な洞察、アクション | 管理者ログイン時のみ |

`books.is_public` フラグで書籍単位の公開制御を行う。
メモは `memos.is_public` で個別に公開/非公開を切り替え可能。

## wrangler.jsonc 設定

```jsonc
{
  "name": "reading-bookshelf",
  "compatibility_date": "2026-02-15",
  "pages_build_output_dir": ".vercel/output/static",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "reading-bookshelf",
      "database_id": "<database-id>"
    }
  ]
}
```

## 環境バインディング型定義

```typescript
interface CloudflareEnv {
  DB: D1Database;
}
```
