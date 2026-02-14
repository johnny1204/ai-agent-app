# Notion API データ取得パターン

## 認証

```typescript
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function notionHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}
```

## データベースクエリ

```typescript
type NotionPage = {
  id: string;
  properties: Record<string, any>;
  created_time: string;
  last_edited_time: string;
};

async function queryDatabase(
  token: string,
  databaseId: string,
  filter?: Record<string, unknown>,
  sorts?: { property: string; direction: 'ascending' | 'descending' }[],
): Promise<NotionPage[]> {
  const body: Record<string, unknown> = {};
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;

  const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: notionHeaders(token),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
  const data = await res.json();
  return data.results;
}
```

## タスク取得（フィルタ例）

```typescript
// 最終更新日以降のタスクを取得
async function fetchUpdatedTasks(token: string, databaseId: string, since: string) {
  return queryDatabase(token, databaseId, {
    filter: {
      property: 'Last Edited',
      date: { on_or_after: since },
    },
  }, [
    { property: 'Last Edited', direction: 'descending' },
  ]);
}

// ステータス別タスク取得
async function fetchTasksByStatus(token: string, databaseId: string, status: string) {
  return queryDatabase(token, databaseId, {
    filter: {
      property: 'Status',
      status: { equals: status },
    },
  });
}
```

## プロパティ値の取出し

Notionのプロパティは型ごとに構造が異なるため、ヘルパー関数を使う。

```typescript
function extractProperty(prop: any): string | number | boolean | null {
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title.map((t: any) => t.plain_text).join('');
    case 'rich_text':
      return prop.rich_text.map((t: any) => t.plain_text).join('');
    case 'number':
      return prop.number;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.map((s: any) => s.name).join(', ');
    case 'status':
      return prop.status?.name || null;
    case 'date':
      return prop.date?.start || null;
    case 'checkbox':
      return prop.checkbox;
    case 'people':
      return prop.people.map((p: any) => p.name).join(', ');
    case 'url':
      return prop.url;
    default:
      return null;
  }
}

// タスクデータへの変換例
function toTask(page: NotionPage): {
  id: string;
  title: string;
  status: string | null;
  assignee: string | null;
  due_date: string | null;
  updated_at: string;
} {
  return {
    id: page.id,
    title: extractProperty(page.properties['Name']) as string,
    status: extractProperty(page.properties['Status']) as string | null,
    assignee: extractProperty(page.properties['Assignee']) as string | null,
    due_date: extractProperty(page.properties['Due Date']) as string | null,
    updated_at: page.last_edited_time,
  };
}
```

## ページネーション（100件以上取得）

```typescript
async function queryAllPages(
  token: string,
  databaseId: string,
  filter?: Record<string, unknown>,
): Promise<NotionPage[]> {
  const all: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (filter) body.filter = filter;
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: notionHeaders(token),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    all.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return all;
}
```
