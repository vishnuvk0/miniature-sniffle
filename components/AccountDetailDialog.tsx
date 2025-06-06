'use client';

import { useState, useEffect, FormEvent } from "react";
import { Account } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { Trash2 } from 'lucide-react';
import { TimeRange, TimeRangeFilter } from "./charts/TimeRangeFilter";

const DynamicMiniLineChart = dynamic(
  () => import("./charts/MiniLineChart"),
  {
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div>,
  }
);

export interface AccountDetailDialogProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHistory: (accountId: string, newBalance: number, newDate: string, reason?: string) => void;
  onDeleteHistoryEntry: (accountId: string, historyId: string) => void;
}

export function AccountDetailDialog({ account, isOpen, onClose, onUpdateHistory, onDeleteHistoryEntry }: AccountDetailDialogProps) {
  const [newBalance, setNewBalance] = useState<string | number>("");
  const [newDate, setNewDate] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  useEffect(() => {
    if (account && isOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setNewDate(`${year}-${month}-${day}`);
      setNewBalance("");
      setTimeRange("ALL"); // Reset timerange on dialog open
    }
  }, [account, isOpen]);

  if (!account) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numericBalance = typeof newBalance === 'string' ? parseFloat(newBalance) : newBalance;
    if (isNaN(numericBalance) || !newDate) {
      alert("Please enter a valid balance and date.");
      return;
    }
    onUpdateHistory(account.id, numericBalance, newDate);
    setNewBalance("");
  };
  
  const chartData = account.history
    .filter(entry => {
      const now = new Date();
      let startDate: Date;
      switch (timeRange) {
        case "1D": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); break;
        case "1W": startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
        case "MTD": startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "YTD": startDate = new Date(now.getFullYear(), 0, 1); break;
        default: startDate = new Date(0); break;
      }
      return new Date(entry.date) >= startDate;
    })
    .map(entry => ({
      name: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: entry.balance,
      originalDate: entry.date,
    }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Account Details: {account.name}</DialogTitle>
          <DialogDescription>
            Current Balance: {account.balance.toLocaleString()} (as of {new Date(account.date).toLocaleDateString()})
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 h-72">
          <DynamicMiniLineChart data={chartData} />
        </div>
        <TimeRangeFilter value={timeRange} onValueChange={setTimeRange} />

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <h3 className="text-lg font-medium mb-2">Update Balance</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newBalance" className="text-right">
                New Balance
              </Label>
              <Input
                id="newBalance"
                type="number"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 80,000"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newDate" className="text-right">
                Date
              </Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Update Balance</Button>
          </DialogFooter>
        </form>
        
        {/* Optional: Display history table */}
        <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Balance History</h3>
            <div className="max-h-48 overflow-y-auto border rounded-md">
                {account.history.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                            <tr>
                                <th className="p-2 text-left font-semibold">Date</th>
                                <th className="p-2 text-right font-semibold">Balance</th>
                                <th className="p-2 text-center font-semibold">Discard</th>
                            </tr>
                        </thead>
                        <tbody>
                            {account.history.slice().reverse().map((entry) => (
                                <tr key={entry.id} className="border-b last:border-b-0">
                                    <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="p-2 text-right">{entry.balance.toLocaleString()}</td>
                                    <td className="p-2 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDeleteHistoryEntry(account.id, entry.id)}
                                            aria-label="Delete history entry"
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="p-4 text-muted-foreground">No history entries yet.</p>
                )}
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
} 