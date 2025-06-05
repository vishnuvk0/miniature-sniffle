"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Account } from "@/lib/types";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import the MiniLineChart component
const DynamicMiniLineChart = dynamic(
  () => import("@/components/charts/MiniLineChart"),
  { 
    ssr: false, // Ensure it's only rendered on the client
    loading: () => <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div> 
  }
);

export interface AccountCardProps {
  account: Account;
  onOpenAccount: (accountId: string) => void;
}

export function AccountCard({ account, onOpenAccount }: AccountCardProps) {
  const chartData = account.history.map(entry => ({
    name: entry.date.substring(5),
    balance: entry.balance,
    originalDate: entry.date,
  }));

  return (
    <Card 
      className="flex flex-col h-full cursor-pointer transition-all duration-200 ease-in-out hover:scale-102 hover:shadow-lg"
      onClick={() => onOpenAccount(account.id)}
    >
      <CardHeader>
        <CardTitle className="truncate">{account.accountName}</CardTitle>
        <CardDescription>Owned by: {account.ownerName}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="mb-4">
          <p className="text-3xl font-bold text-left">
            {account.balance.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Current Balance as of {new Date(account.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex-grow h-24 min-h-[6rem]">
          <DynamicMiniLineChart data={chartData} />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full transition-all duration-200 ease-in-out hover:scale-102 hover:shadow-md"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAccount(account.id);
          }}
        >
          View Details / Adjust
        </Button>
      </CardFooter>
    </Card>
  );
} 