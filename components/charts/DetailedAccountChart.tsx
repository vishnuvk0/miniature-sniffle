'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useMemo } from "react";

// Define the structure of data points for this chart
interface ChartDataPoint {
  name: string; // Formatted date for X-axis
  balance: number;
  originalDate?: string; // Original date for tooltip or other uses
}

interface DetailedAccountChartProps {
  data: ChartDataPoint[];
}

export default function DetailedAccountChart({ data }: DetailedAccountChartProps) {
  // Calculate min and max for gradient
  const { minBalance, maxBalance } = useMemo(() => {
    if (!data || data.length === 0) return { minBalance: 0, maxBalance: 0 };
    return {
      minBalance: Math.min(...data.map(d => d.balance)),
      maxBalance: Math.max(...data.map(d => d.balance))
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No history to display graph for this account.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 20,
          left: 10,
          bottom: 20,
        }}
      >
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgb(34, 197, 94)" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="rgb(34, 197, 94)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
        <XAxis 
          dataKey="name" 
          angle={-30}
          textAnchor="end"
          tick={{ fontSize: '0.75rem', fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tickFormatter={(value) => value.toLocaleString()}
          width={70}
          tick={{ fontSize: '0.75rem', fill: 'hsl(var(--muted-foreground))' }}
          tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          domain={[
            (dataMin: number) => Math.floor(dataMin * 0.95),
            (dataMax: number) => Math.ceil(dataMax * 1.05)
          ]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0 && payload[0].payload.originalDate) {
              return `Date: ${new Date(payload[0].payload.originalDate).toLocaleDateString()}`;
            }
            return `Date: ${label}`;
          }}
          formatter={(value: number) => [value.toLocaleString(), "Balance"]}
        />
        <Legend verticalAlign="top" height={36} />
        <Area
          type="monotone"
          dataKey="balance"
          name="Account Balance"
          stroke="rgb(34, 197, 94)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-in-out"
          fill="url(#colorBalance)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 