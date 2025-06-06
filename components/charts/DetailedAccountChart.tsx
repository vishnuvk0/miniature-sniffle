'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

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
  console.log("[DetailedAccountChart] Data received:", data);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No history to display graph for this account.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 20, // Give some space for right-most Y-axis labels if ever needed
          left: 10,  // Give some space for left-most Y-axis labels
          bottom: 20, // Increased bottom margin for XAxis labels
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={-30}
          textAnchor="end"
          tick={{ fontSize: '0.75rem' }} // Smaller font for axis ticks
          interval="preserveStartEnd" // Show start, end and some ticks in between
        />
        <YAxis 
          tickFormatter={(value) => value.toLocaleString()}
          width={70} // Adjust width as needed for balance numbers
          tick={{ fontSize: '0.75rem' }}
          domain={['auto', 'auto']} // Auto domain based on data
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelFormatter={(label, payload) => {
            // Use originalDate from payload if available for more precise tooltip
            if (payload && payload.length > 0 && payload[0].payload.originalDate) {
              return `Date: ${new Date(payload[0].payload.originalDate).toLocaleDateString()}`;
            }
            return `Date: ${label}`; // Fallback to formatted name
          }}
          formatter={(value: number) => [value.toLocaleString(), "Balance"]}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          type="linear" // Kept linear for consistency in testing
          dataKey="balance"
          name="Account Balance"
          stroke="green" // Use a hardcoded, obvious color for testing
          strokeWidth={2}
          dot={true} // Always show dots for testing
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 