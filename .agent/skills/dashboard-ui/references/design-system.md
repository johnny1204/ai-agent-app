# デザインシステム

## カラーパレット

### ダークモード（推奨デフォルト）

```css
:root {
  /* 背景 */
  --bg-primary: #0f1117;
  --bg-secondary: #1a1d2e;
  --bg-card: #1e2235;
  --bg-hover: #252a40;

  /* テキスト */
  --text-primary: #e4e6f0;
  --text-secondary: #8b8fa3;
  --text-muted: #5a5e72;

  /* アクセント */
  --accent-blue: #4f8ff7;
  --accent-green: #34d399;
  --accent-red: #f87171;
  --accent-yellow: #fbbf24;
  --accent-purple: #a78bfa;
  --accent-cyan: #22d3ee;

  /* チャートカラー（6色セット） */
  --chart-1: #4f8ff7;
  --chart-2: #34d399;
  --chart-3: #a78bfa;
  --chart-4: #fbbf24;
  --chart-5: #f87171;
  --chart-6: #22d3ee;

  /* ボーダー */
  --border-default: #2a2e42;
  --border-light: #1e2235;

  /* シャドウ */
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}
```

### ライトモード

```css
[data-theme="light"] {
  --bg-primary: #f8f9fc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-hover: #f1f3f9;

  --text-primary: #1a1d2e;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;

  --border-default: #e2e8f0;
  --border-light: #f1f5f9;

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## タイポグラフィ

```css
/* Google Fonts: Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

.text-xs   { font-size: 0.75rem; }   /* 12px - ラベル、補足 */
.text-sm   { font-size: 0.875rem; }  /* 14px - 本文 */
.text-base { font-size: 1rem; }      /* 16px - 小見出し */
.text-lg   { font-size: 1.25rem; }   /* 20px - セクション見出し */
.text-xl   { font-size: 1.5rem; }    /* 24px - ページ見出し */
.text-2xl  { font-size: 2rem; }      /* 32px - KPI数値 */
.text-3xl  { font-size: 2.5rem; }    /* 40px - ヒーロー数値 */
```

## スペーシング

```css
/* 4px基準のスペーシングスケール */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
```

## カードスタイル

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
```

## KPIカードスタイル

```css
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--space-5);
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.kpi-title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.kpi-change {
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: var(--space-2);
}

.kpi-change.positive { color: var(--accent-green); }
.kpi-change.negative { color: var(--accent-red); }
```

## サイドバーレイアウト

```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: 240px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-default);
  padding: var(--space-4);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .main-content {
    margin-left: 0;
  }
}
```
