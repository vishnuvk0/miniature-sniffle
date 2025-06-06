'use client';

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Account } from "@/lib/types";
import { TimeRangeFilter, TimeRange } from "./TimeRangeFilter";

interface ChartDataPoint {
  date: string;
  totalBalance: number;
}

interface MainProgressChartProps {
  accounts: Account[];
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MainProgressChart({ accounts }: MainProgressChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const chartData = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate = new Date(0);

    switch (timeRange) {
      case "1D": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); break;
      case "1W": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
      case "MTD": startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    const allHistoryEntries = accounts.flatMap(acc => acc.history);
    if (allHistoryEntries.length === 0) return [];

    const dateSet = new Set<number>();
    allHistoryEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (entryDate >= startDate) {
            dateSet.add(new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).getTime());
        }
    });

    const sortedUniqueDates = Array.from(dateSet).sort().map(ts => new Date(ts));
    
    const processedData = sortedUniqueDates.map(date => {
        let totalBalanceOnDate = 0;
        accounts.forEach(account => {
            const relevantHistory = account.history
                .filter(entry => new Date(entry.date).getTime() <= (date.getTime() + 86399999)) // up to end of the day
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (relevantHistory.length > 0) {
                totalBalanceOnDate += relevantHistory[0].balance;
            }
        });
        return {
            date: formatDate(date),
            totalBalance: totalBalanceOnDate,
        };
    });
    
    const lastDataPoint = processedData[processedData.length - 1];
    if (lastDataPoint && new Date(lastDataPoint.date) < now) {
        processedData.push({
            date: formatDate(now),
            totalBalance: lastDataPoint.totalBalance,
        });
    }

    return processedData;
  }, [accounts, timeRange]);

  if (chartData.length === 0) {
    return (
      <>
        <div className="h-full flex items-center justify-center text-lg text-muted-foreground">
          No data for selected period.
        </div>
        <TimeRangeFilter value={timeRange} onValueChange={setTimeRange} />
      </>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="colorTotalBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
            domain={['dataMin - 1000', 'dataMax + 1000']}
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
          <Area
            type="monotone"
            dataKey="totalBalance"
            name="Total Points/Miles"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTotalBalance)"
            dot={true}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      <TimeRangeFilter value={timeRange} onValueChange={setTimeRange} />
    </>
  );
} 