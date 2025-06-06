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
import { Building, CreditCard, Plane } from "lucide-react";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

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
  onDeleteAccount: (accountId: string) => Promise<void>;
}

export function AccountCard({ account, onOpenAccount, onDeleteAccount }: AccountCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getIcon = () => {
    switch (account.category) {
      case "AIRLINE":
        return <Plane className="h-5 w-5 text-blue-400" />;
      case "HOTEL":
        return <Building className="h-5 w-5 text-amber-400" />;
      case "CREDIT_CARD":
        return <CreditCard className="h-5 w-5 text-slate-400" />;
      default:
        return null;
    }
  };

  const chartData = account.history.map(entry => ({
    name: entry.date.substring(5),
    balance: entry.balance,
    originalDate: entry.date,
  }));

  return (
    <Card className="relative overflow-hidden group">
      <DeleteAccountDialog account={account} onDelete={onDeleteAccount} />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon()}
          {account.name}
        </CardTitle>
        <CardDescription>Last updated: {new Date(account.updatedAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="mb-4">
          <p className="text-3xl font-bold text-left">
            {formatNumber(account.balance)}
            <span className="text-sm font-normal text-muted-foreground ml-1">points</span>
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