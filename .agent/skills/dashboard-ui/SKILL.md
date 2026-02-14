---
name: dashboard-ui
description: Next.jsを使ったダッシュボードUIの構築ガイド。チャート（折れ線、棒、円、エリア）、KPIカード、データテーブル、レイアウトグリッドなどの実装パターンを提供。Rechartsを用いたデータ可視化、レスポンシブデザイン、ダークモード対応に使用する。ダッシュボード、グラフ、チャート、KPIカード、可視化UIの作成・修正時にトリガーする。
---

# ダッシュボードUI 構築ガイド

Next.js App Router + Recharts でダッシュボードUIを構築するためのガイド。

## 依存パッケージ

```bash
npm install recharts date-fns
```

## コンポーネント構成

```
src/app/dashboard/
├── layout.tsx           # ダッシュボードレイアウト（サイドバー+メインエリア）
├── page.tsx             # 概要ページ
├── commits/page.tsx     # コミット分析ページ
└── tasks/page.tsx       # タスク分析ページ

src/components/
├── layout/
│   ├── Sidebar.tsx
│   └── Header.tsx
├── charts/
│   ├── LineChart.tsx     # 時系列データ
│   ├── BarChart.tsx      # 比較データ
│   ├── PieChart.tsx      # 構成比
│   └── AreaChart.tsx     # 累積データ
├── cards/
│   ├── KpiCard.tsx       # 数値KPI表示
│   └── TrendCard.tsx     # トレンド付きKPI
└── tables/
    └── DataTable.tsx     # ソート・ページネーション付きテーブル
```

## デザインシステム

カラーパレット、タイポグラフィ、レイアウト設計は [design-system.md](references/design-system.md) を参照。

## チャート実装パターン

Rechartsの各チャートタイプ、データ変換、カスタマイズパターンは [chart-patterns.md](references/chart-patterns.md) を参照。

## KPIカード基本パターン

```tsx
type KpiCardProps = {
  title: string;
  value: number | string;
  change?: number;       // 前期比 (%)
  icon?: React.ReactNode;
};

function KpiCard({ title, value, change, icon }: KpiCardProps) {
  const isPositive = change && change > 0;
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        {icon && <span className="kpi-icon">{icon}</span>}
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">{value}</div>
      {change !== undefined && (
        <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
```

## レスポンシブレイアウト

```css
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.chart-container {
  grid-column: span 2;
}
```
