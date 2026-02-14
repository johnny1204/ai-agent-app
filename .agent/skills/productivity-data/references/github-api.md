# GitHub API データ取得パターン

## 認証

```typescript
const GITHUB_API = 'https://api.github.com';

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'productivity-dashboard',
  };
}
```

## コミット取得

```typescript
type GitHubCommit = {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
};

async function fetchCommits(
  token: string,
  repo: string,
  since: string,
  perPage = 100,
): Promise<{ sha: string; message: string; author: string; date: string }[]> {
  const url = `${GITHUB_API}/repos/${repo}/commits?since=${since}&per_page=${perPage}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data: GitHubCommit[] = await res.json();
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0], // 1行目のみ
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}
```

## Pull Request 取得

```typescript
type GitHubPR = {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string };
  created_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
};

async function fetchPullRequests(
  token: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'all',
  since?: string,
): Promise<GitHubPR[]> {
  let url = `${GITHUB_API}/repos/${repo}/pulls?state=${state}&per_page=100&sort=updated&direction=desc`;
  if (since) url += `&since=${since}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}
```

## Issue 取得

```typescript
async function fetchIssues(
  token: string,
  repo: string,
  since?: string,
): Promise<{ id: number; number: number; title: string; state: string; author: string; created_at: string; closed_at: string | null }[]> {
  let url = `${GITHUB_API}/repos/${repo}/issues?state=all&per_page=100&sort=updated`;
  if (since) url += `&since=${since}`;
  const res = await fetch(url, { headers: githubHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data = await res.json();
  // PRを除外（issuesエンドポイントはPRも返す）
  return data
    .filter((issue: any) => !issue.pull_request)
    .map((issue: any) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      author: issue.user.login,
      created_at: issue.created_at,
      closed_at: issue.closed_at,
    }));
}
```

## レートリミット対策

```typescript
async function checkRateLimit(token: string): Promise<{ remaining: number; reset: Date }> {
  const res = await fetch(`${GITHUB_API}/rate_limit`, { headers: githubHeaders(token) });
  const data = await res.json();
  return {
    remaining: data.rate.remaining,
    reset: new Date(data.rate.reset * 1000),
  };
}

// Cron Worker内での使用パターン
async function safeFetch(token: string, repo: string, since: string) {
  const { remaining } = await checkRateLimit(token);
  if (remaining < 10) {
    console.log('Rate limit low, skipping fetch');
    return [];
  }
  return fetchCommits(token, repo, since);
}
```

## ページネーション（100件以上取得）

```typescript
async function fetchAllCommits(
  token: string,
  repo: string,
  since: string,
): Promise<{ sha: string; message: string; author: string; date: string }[]> {
  const all: { sha: string; message: string; author: string; date: string }[] = [];
  let page = 1;

  while (true) {
    const url = `${GITHUB_API}/repos/${repo}/commits?since=${since}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers: githubHeaders(token) });
    if (!res.ok) break;

    const data: GitHubCommit[] = await res.json();
    if (data.length === 0) break;

    all.push(...data.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
    })));

    if (data.length < 100) break;
    page++;
  }

  return all;
}
```
