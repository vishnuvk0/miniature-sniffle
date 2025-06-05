'use client';

import { useMemo } from "react";
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
import { Account } from "@/lib/types";

export interface OverallProgressChartDataPoint {
  date: string; 
  totalBalance: number;
}

interface MainProgressChartProps {
  accounts: Account[];
}

const formatDateForAxis = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


export default function MainProgressChart({ accounts }: MainProgressChartProps) {
  const chartData = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return [];
    }

    const allHistoryEntriesFlat: Array<{ date: string; balance: number; accountId: string }> = [];
    accounts.forEach(acc => {
      acc.history.forEach(entry => {
        allHistoryEntriesFlat.push({
          date: entry.date,
          balance: entry.balance,
          accountId: acc.id
        });
      });
    });

    if (allHistoryEntriesFlat.length === 0) return [];

    const uniqueDates = Array.from(new Set(allHistoryEntriesFlat.map(e => e.date)))
                            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const processedData: OverallProgressChartDataPoint[] = uniqueDates.map(date => {
      let totalBalanceOnDate = 0;
      accounts.forEach(acc => {
        const relevantHistory = acc.history
          .filter(h => new Date(h.date).getTime() <= new Date(date).getTime())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (relevantHistory.length > 0) {
          totalBalanceOnDate += relevantHistory[0].balance;
        }
      });
      return {
        date: date, // Store original date for now
        totalBalance: totalBalanceOnDate,
      };
    });
    
    // Format date for axis and handle potential duplicates from formatting
    const finalChartData = processedData.map(p => ({...p, date: formatDateForAxis(p.date)}))
      .reduce((acc, current) => {
        const existing = acc.find(item => item.date === current.date);
        if (existing) {
          existing.totalBalance = current.totalBalance; // Ensure latest balance for the formatted date
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as OverallProgressChartDataPoint[]); 

    return finalChartData;

  }, [accounts]);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-lg text-muted-foreground">
        Add accounts with history to see overall progress.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 20, 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
        <XAxis 
          dataKey="date" 
          angle={-30}
          textAnchor="end"
          tick={{ fontSize: '0.75rem' }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tickFormatter={(value) => value.toLocaleString()}
          width={80} 
          tick={{ fontSize: '0.75rem' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
          labelFormatter={(label) => `Date: ${label}`} 
          formatter={(value: number) => [value.toLocaleString(), "Total Balance"]}
        />
        <Legend verticalAlign="top" height={36}/>
        <Line
          type="monotone"
          dataKey="totalBalance"
          name="Total Points/Miles"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={chartData.length < 20} 
          isAnimationActive={true}
          animationDuration={1000}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 