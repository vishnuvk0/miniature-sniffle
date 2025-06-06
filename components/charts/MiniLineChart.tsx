'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface MiniLineChartProps {
  data: Array<{ name: string; balance: number; originalDate?: string }>;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MiniLineChart({ data }: MiniLineChartProps) {
  const { processedData, trend } = useMemo(() => {
    if (!data || data.length < 1) {
      return { processedData: [], trend: 'flat' };
    }

    // Sort data chronologically, assuming originalDate is available
    const sortedData = [...data].sort((a, b) => 
      new Date(a.originalDate || 0).getTime() - new Date(b.originalDate || 0).getTime()
    );

    const lastEntry = sortedData[sortedData.length - 1];
    const today = new Date();

    if (lastEntry && new Date(lastEntry.originalDate || 0) < today) {
      sortedData.push({
        ...lastEntry,
        name: formatDate(today),
        originalDate: today.toISOString(),
      });
    }
    
    let trend = 'flat';
    if (sortedData.length > 1) {
      const firstBalance = sortedData[0].balance;
      const lastBalance = sortedData[sortedData.length - 1].balance;
      if (lastBalance > firstBalance) {
        trend = 'up';
      } else if (lastBalance < firstBalance) {
        trend = 'down';
      }
    }

    return { processedData: sortedData, trend };
  }, [data]);

  if (processedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No history for graph
      </div>
    );
  }

  const trendColor = {
    up: { light: '#10B981', dark: '#059669' },
    down: { light: '#EF4444', dark: '#DC2626' },
    flat: { light: '#6B7280', dark: '#4B5563' },
  }[trend];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={processedData}
        margin={{
          top: 5,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id={`mini-chart-gradient-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={trendColor.light} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={trendColor.light} stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" hide={true} />
        <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "0.75rem",
            padding: "4px 8px",
          }}
          labelFormatter={(_, payload) => {
            if (payload && payload.length > 0 && payload[0].payload.originalDate) {
              return `Date: ${new Date(payload[0].payload.originalDate).toLocaleDateString()}`;
            }
            return "";
          }}
          formatter={(value: number) => [value.toLocaleString(), "Balance"]}
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={trendColor.dark}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#mini-chart-gradient-${trend})`}
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 