'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type DaySeries = { date: string; count: number }
type RevenueSeries = { date: string; cents: number }

function shortDate(d: string) {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

function Chart({
  title,
  data,
  dataKey,
  color,
  formatter,
}: {
  title: string
  data: Record<string, number | string>[]
  dataKey: string
  color: string
  formatter?: (v: number) => string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 10, fill: 'currentColor' }}
            axisLine={false}
            tickLine={false}
            interval={3}
            className="text-muted-foreground"
          />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(label) => shortDate(String(label ?? ''))}
            formatter={(v) => [formatter ? formatter(Number(v)) : v, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AnalyticsCharts({
  usersPerDay,
  packsPerDay,
  revenuePerDay,
}: {
  usersPerDay: DaySeries[]
  packsPerDay: DaySeries[]
  revenuePerDay: RevenueSeries[]
}) {
  const revData = revenuePerDay.map((r) => ({ ...r, dollars: r.cents / 100 }))

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Chart
        title="New Users"
        data={usersPerDay}
        dataKey="count"
        color="#a855f7"
      />
      <Chart
        title="Packs Opened"
        data={packsPerDay}
        dataKey="count"
        color="#06b6d4"
      />
      <Chart
        title="Revenue"
        data={revData}
        dataKey="dollars"
        color="#22c55e"
        formatter={(v) => `$${v.toFixed(2)}`}
      />
    </div>
  )
}
