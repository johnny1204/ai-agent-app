---
name: webapp-testing
description: Next.js + Hono + Cloudflare Workersアプリのテスト戦略・実装ガイド。Vitest/Jestを使ったユニットテスト、Hono APIの統合テスト、D1のモック、ブラウザテスト（Playwright）に使用する。テスト作成、テスト設計、テスト実行、TDD、品質保証に関するタスクでトリガーする。
---

# Webアプリ テストガイド

Next.js + Hono + Cloudflare Workers アプリケーションのテスト実装ガイド。
**TDD（テスト駆動開発）を基本の開発フローとする。**

## TDD 開発フロー（t-wada方式）

すべての機能実装はTDDの **Red → Green → Refactor** サイクルで進める。

### 基本サイクル

```
1. Red    — 失敗するテストを1つ書く（まだ実装がないので失敗する）
2. Green  — テストを通す最小限のコードを書く（仮実装でOK）
3. Refactor — テストが通ったままコードを整理する
```

このサイクルを小さく速く回すことが重要。1サイクルは数分以内を目安とする。

### TODOリスト駆動

実装前に「テストすべきこと」のTODOリストを作成し、1つずつ消化する:

```markdown
## GET /api/commits のTODOリスト
- [ ] 空のDBから空配列が返る
- [ ] コミットが日付降順で返る
- [ ] repoパラメータでフィルタできる
- [ ] limitパラメータで件数制限できる
- [ ] 不正なパラメータで400が返る
```

### 実装のステップ

**仮実装（Fake It）**: まず定数を返してテストを通す

```typescript
// Red: テストを書く
it('should return empty array when no commits', async () => {
  const res = await app.request('/api/commits');
  const json = await res.json();
  expect(json.data).toEqual([]);
});

// Green: 仮実装で通す
commits.get('/', (c) => c.json({ data: [] }));
```

**三角測量（Triangulation）**: 2つ目のテストケースで実装を一般化する

```typescript
// 2つ目のテストを追加して仮実装では通らなくする
it('should return commits from DB', async () => {
  // DBにテストデータを投入
  const res = await app.request('/api/commits');
  const json = await res.json();
  expect(json.data).toHaveLength(2);
});

// Green: 本実装に置き換える
commits.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM commits ORDER BY committed_at DESC'
  ).all();
  return c.json({ data: results });
});
```

**Refactor**: テストが通ったままコードを整理する（ロジック抽出、命名改善等）

### TDDの原則

- **テストを書く前にプロダクションコードを書かない**
- **失敗するテストが1つだけある状態を保つ**（複数同時に失敗させない）
- **テストコードもリファクタリング対象** — 重複を減らし可読性を高める
- **テスト名は日本語OK** — 仕様がそのまま読めるテスト名を推奨

## テストサイズ（Google Testing Blog準拠）

テストは「種類（unit/integration/e2e）」ではなく **サイズ（Small/Medium/Large）** で分類する。
サイズはテストの実行制約で決まる。

> 参考: [Google Testing Blog - Test Sizes](https://testing.googleblog.com/2010/12/test-sizes.html)

| 制約 | Small | Medium | Large |
|------|-------|--------|-------|
| ネットワーク | ✗ 不可 | localhost のみ | ○ 可 |
| データベース | ✗ 不可 | ○ 可 | ○ 可 |
| ファイルシステム | ✗ 不可 | ○ 可 | ○ 可 |
| 外部サービス | ✗ 不可 | ✗ 不可 | ○ 可 |
| 実行時間上限 | ~60秒 | ~300秒 | ~900秒以上 |
| 並列実行 | ○ 可 | ○ 可 | △ 制限あり |

### 本プロジェクトでのマッピング

| サイズ | 対象 | ツール | 例 |
|--------|------|--------|-----|
| **Small** | 純粋関数、データ変換、バリデーション | Vitest | `aggregateByDate()`, `extractProperty()` |
| **Medium** | Hono APIルート + D1モック | Vitest + miniflare | `GET /api/commits` のレスポンス検証 |
| **Large** | ダッシュボードUI全体の動作 | Playwright | KPIカード表示、チャートフィルタ操作 |

### テストピラミッド比率

```
        /  Large  \      ~10%  遅い・壊れやすい・高信頼
       /  Medium   \     ~20%
      /   Small     \    ~70%  速い・安定・高頻度実行
```

**Small を厚く、Large を薄く** 保つ。CIでは Small → Medium → Large の順に実行し、早い段階でフィードバックを得る。

## テストスタック

```bash
npm install -D vitest @cloudflare/vitest-pool-workers playwright @playwright/test
```

## テスト構成

```
tests/
├── unit/              # ユニットテスト
│   ├── utils.test.ts
│   └── transforms.test.ts
├── api/               # API統合テスト（Hono）
│   ├── commits.test.ts
│   └── tasks.test.ts
├── e2e/               # E2Eテスト（Playwright）
│   └── dashboard.spec.ts
└── mocks/             # モックデータ・ヘルパー
    ├── d1.ts
    └── fixtures.ts
```

## Vitest 設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare', // Cloudflare Workers環境
    include: ['tests/**/*.test.ts'],
  },
});
```

## Hono API テスト

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import app from '@/server';

describe('GET /api/commits', () => {
  it('should return commits list', async () => {
    const res = await app.request('/api/commits');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should filter by repo', async () => {
    const res = await app.request('/api/commits?repo=owner/repo1');
    expect(res.status).toBe(200);
  });

  it('should return 400 for invalid params', async () => {
    const res = await app.request('/api/commits?limit=-1');
    expect(res.status).toBe(400);
  });
});
```

## モック指針: 自分が所有しない型をモックしない

> 参考: [Google Testing Blog - Don't Mock Types You Don't Own](https://testing.googleblog.com/2020/07/testing-on-toilet-dont-mock-types-you.html)

`D1Database`、`fetch`（GitHub/Notion API）など**自分が所有しない型を直接モックしない**。
理由: ライブラリのAPI変更でモックが実態と乖離し、テストが通るのに本番で壊れる。

### 解決策: 自分が所有するラッパーを作り、それをモックする

```typescript
// src/server/repositories/commit-repository.ts
// ← 自分が所有する型。これをモック対象にする
export interface CommitRepository {
  findAll(params: { repo?: string; limit?: number }): Promise<Commit[]>;
  countByDate(from: string, to: string): Promise<{ date: string; count: number }[]>;
  insertBatch(commits: NewCommit[]): Promise<void>;
}

// 本番用: D1を使う実装
export class D1CommitRepository implements CommitRepository {
  constructor(private db: D1Database) {}

  async findAll({ repo, limit = 50 }: { repo?: string; limit?: number }) {
    let sql = 'SELECT * FROM commits';
    const params: unknown[] = [];
    if (repo) { sql += ' WHERE repo = ?'; params.push(repo); }
    sql += ' ORDER BY committed_at DESC LIMIT ?';
    params.push(limit);
    const stmt = this.db.prepare(sql);
    const { results } = await stmt.bind(...params).all();
    return results as Commit[];
  }

  // ...他メソッドも同様
}
```

```typescript
// テスト用: インメモリ実装（Fake）
export class FakeCommitRepository implements CommitRepository {
  private commits: Commit[] = [];

  seed(commits: Commit[]) { this.commits = commits; }

  async findAll({ repo, limit = 50 }) {
    let result = this.commits;
    if (repo) result = result.filter(c => c.repo === repo);
    return result.slice(0, limit);
  }

  async countByDate(from: string, to: string) {
    // 簡易集計
    const map = new Map<string, number>();
    this.commits
      .filter(c => c.committed_at >= from && c.committed_at < to)
      .forEach(c => {
        const d = c.committed_at.slice(0, 10);
        map.set(d, (map.get(d) || 0) + 1);
      });
    return Array.from(map, ([date, count]) => ({ date, count }));
  }

  async insertBatch(commits: NewCommit[]) {
    this.commits.push(...commits as Commit[]);
  }
}
```

### 外部APIも同様にラップする

```typescript
// src/server/clients/github-client.ts
export interface GitHubClient {
  fetchCommits(repo: string, since: string): Promise<GitHubCommitData[]>;
}

// 本番: 実API
export class RealGitHubClient implements GitHubClient { /* fetch使用 */ }

// テスト: Fake
export class FakeGitHubClient implements GitHubClient {
  private data: GitHubCommitData[] = [];
  seed(data: GitHubCommitData[]) { this.data = data; }
  async fetchCommits() { return this.data; }
}
```

### 判断基準まとめ

| 対象 | モックする？ | 代わりにどうする？ |
|------|-------------|-------------------|
| `D1Database` | ✗ | `CommitRepository` インターフェース + Fake実装 |
| `fetch` (GitHub) | ✗ | `GitHubClient` インターフェース + Fake実装 |
| `fetch` (Notion) | ✗ | `NotionClient` インターフェース + Fake実装 |
| 自作の `CommitRepository` | ○ | Fake実装で差し替え |
| 自作のユーティリティ関数 | ○ | 直接テスト（モック不要な場合が多い） |

## Playwright E2Eテスト

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display KPI cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.kpi-card')).toHaveCount(4);
  });

  test('should render charts', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[name="from"]', '2026-01-01');
    await page.fill('[name="to"]', '2026-01-31');
    await page.click('button:has-text("適用")');
    await expect(page.locator('.kpi-card')).toBeVisible();
  });
});
```

## テスト実行コマンド

```bash
# ユニット + API テスト
npx vitest run

# ウォッチモード
npx vitest

# E2E テスト
npx playwright test

# カバレッジ
npx vitest run --coverage
```
