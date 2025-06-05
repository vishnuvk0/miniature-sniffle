'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface MiniLineChartProps {
  data: Array<{ name: string; balance: number; originalDate?: string }>; // Added originalDate for tooltip
}

export default function MiniLineChart({ data }: MiniLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No history for graph
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 10,
          left: -25, // Pulls Y-axis ticks closer if they were visible
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" hide={true} />
        <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: "0.75rem", // Smaller font for mini tooltip
            padding: "4px 8px",
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload.length > 0 && payload[0].payload.originalDate) {
              return `Date: ${new Date(payload[0].payload.originalDate).toLocaleDateString()}`;
            }
            return `Period: ${label}`;
          }}
          formatter={(value: number) => [value.toLocaleString(), "Balance"]}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={data.length <= 5 || data.length === 1} // Show dots if few points
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 