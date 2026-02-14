# Recharts チャートパターン集

## 共通インポート

```tsx
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
```

## チャートカラー定数

```tsx
const COLORS = ['#4f8ff7', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#22d3ee'];
```

## 折れ線チャート（時系列データ）

コミット数・タスク完了数の推移など。

```tsx
type TimeSeriesData = { date: string; value: number }[];

function TimeSeriesChart({ data, label }: { data: TimeSeriesData; label: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" />
        <XAxis dataKey="date" stroke="#8b8fa3" fontSize={12} />
        <YAxis stroke="#8b8fa3" fontSize={12} />
        <Tooltip
          contentStyle={{ background: '#1e2235', border: '1px solid #2a2e42', borderRadius: 8 }}
          labelStyle={{ color: '#e4e6f0' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name={label}
          stroke="#4f8ff7"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## 複数折れ線チャート

```tsx
type MultiLineData = { date: string; [key: string]: string | number }[];

function MultiLineChart({ data, lines }: {
  data: MultiLineData;
  lines: { key: string; label: string; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" />
        <XAxis dataKey="date" stroke="#8b8fa3" fontSize={12} />
        <YAxis stroke="#8b8fa3" fontSize={12} />
        <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2e42', borderRadius: 8 }} />
        <Legend />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} name={line.label}
            stroke={line.color} strokeWidth={2} dot={{ r: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## 棒グラフ（比較データ）

リポジトリ別・ユーザー別のコミット数比較など。

```tsx
function ComparisonBarChart({ data, xKey, yKey, label }: {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" />
        <XAxis dataKey={xKey} stroke="#8b8fa3" fontSize={12} />
        <YAxis stroke="#8b8fa3" fontSize={12} />
        <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2e42', borderRadius: 8 }} />
        <Bar dataKey={yKey} name={label} fill="#4f8ff7" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## 積み上げ棒グラフ

```tsx
function StackedBarChart({ data, xKey, stacks }: {
  data: Record<string, unknown>[];
  xKey: string;
  stacks: { key: string; label: string; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" />
        <XAxis dataKey={xKey} stroke="#8b8fa3" fontSize={12} />
        <YAxis stroke="#8b8fa3" fontSize={12} />
        <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2e42', borderRadius: 8 }} />
        <Legend />
        {stacks.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## 円グラフ（構成比）

タスクステータス割合、リポジトリ別活動比率など。

```tsx
type PieData = { name: string; value: number }[];

function DonutChart({ data }: { data: PieData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
          paddingAngle={5} dataKey="value" label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

## エリアチャート（累積データ）

```tsx
function CumulativeChart({ data, dataKey, label }: {
  data: Record<string, unknown>[];
  dataKey: string;
  label: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f8ff7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f8ff7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" />
        <XAxis dataKey="date" stroke="#8b8fa3" fontSize={12} />
        <YAxis stroke="#8b8fa3" fontSize={12} />
        <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2e42', borderRadius: 8 }} />
        <Area type="monotone" dataKey={dataKey} name={label}
          stroke="#4f8ff7" fill="url(#gradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

## データ変換ユーティリティ

```typescript
import { format, parseISO, startOfWeek, eachDayOfInterval } from 'date-fns';

// 日ごとの集計
function aggregateByDate<T extends { date: string }>(items: T[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const date = format(parseISO(item.date), 'yyyy-MM-dd');
    map.set(date, (map.get(date) || 0) + 1);
  });
  return Array.from(map, ([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
}

// 週ごとの集計
function aggregateByWeek<T extends { date: string }>(items: T[]): { week: string; count: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const week = format(startOfWeek(parseISO(item.date)), 'yyyy-MM-dd');
    map.set(week, (map.get(week) || 0) + 1);
  });
  return Array.from(map, ([week, count]) => ({ week, count })).sort((a, b) => a.week.localeCompare(b.week));
}

// 日付範囲の穴埋め（0件の日も含める）
function fillDateGaps(
  data: { date: string; count: number }[],
  start: Date,
  end: Date,
): { date: string; count: number }[] {
  const map = new Map(data.map((d) => [d.date, d.count]));
  return eachDayOfInterval({ start, end }).map((d) => {
    const key = format(d, 'yyyy-MM-dd');
    return { date: key, count: map.get(key) || 0 };
  });
}
```
