'use client';

import { useState, useEffect, FormEvent, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { Trash2 } from 'lucide-react';
import { TimeRange, TimeRangeFilter } from "./charts/TimeRangeFilter";
import { AIRLINE_PROGRAMS, HOTEL_PROGRAMS, CREDIT_CARD_PROGRAMS } from "@/lib/constants";
import { Autocomplete } from "./Autocomplete";
import { formatNumberWithCommas, parsePoints } from "@/lib/utils";

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
  const [newBalance, setNewBalance] = useState("");
  const [newDate, setNewDate] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [pointsUsed, setPointsUsed] = useState("");
  const [spendMethod, setSpendMethod] = useState<string | undefined>(undefined);
  const [partnerName, setPartnerName] = useState("");
  const [cpp, setCpp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleNumericInputChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    // Allow empty string to clear input
    if (value === "") {
      setter("");
      return;
    }

    // Sanitize the input to only allow numbers, commas, and a single decimal point
    const sanitizedValue = value.replace(/[^0-9,.]/g, "");
    
    // Handle 'k' suffix for thousands
    if (value.toLowerCase().endsWith('k') && !value.toLowerCase().endsWith('kk')) {
      const numberPart = value.slice(0, -1).replace(/,/g, '');
      const numericValue = parseFloat(numberPart);
      if (!isNaN(numericValue)) {
        setter(formatNumberWithCommas(numericValue * 1000));
        return;
      }
    }
    
    // Format with commas, but don't parse/reformat so user can type freely
    setter(sanitizedValue);
  };
  
  const handleBlur = (
    value: string,
    setter: (value: string) => void
  ) => {
    if(value) {
      const num = parsePoints(value);
      setter(formatNumberWithCommas(num));
    }
  };

  const sortedHistory = useMemo(() => {
    if (!account) return [];
    return account.history.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [account]);

  const totalEarned = useMemo(() => {
    if (sortedHistory.length === 0) return 0;
    
    // The first entry in history is the initial amount earned.
    let earned = sortedHistory[0].balance;

    // Then, add any subsequent positive deltas.
    for (let i = 1; i < sortedHistory.length; i++) {
      const currentBalance = sortedHistory[i].balance;
      const previousBalance = sortedHistory[i-1].balance;

      if (currentBalance > previousBalance) {
        earned += currentBalance - previousBalance;
      }
    }
    return earned;
  }, [sortedHistory]);

  const allPartners = useMemo(() => {
    const combined = [...AIRLINE_PROGRAMS, ...HOTEL_PROGRAMS, ...CREDIT_CARD_PROGRAMS];
    return [...new Set(combined)].sort();
  }, []);

  if (!account) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numericBalance = parsePoints(newBalance);
    if (isNaN(numericBalance) || !newDate) {
      alert("Please enter a valid balance and date.");
      return;
    }
    onUpdateHistory(account.id, numericBalance, newDate);
    setNewBalance("");
  };
  
  const chartData = sortedHistory
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

  const handleSpendSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/accounts/${account.id}/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsUsed: parsePoints(pointsUsed),
          method: spendMethod,
          partnerName: spendMethod === 'Transfer to Partner' ? partnerName : undefined,
          cpp: spendMethod === 'Transfer to Partner' ? cpp : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log spending');
      }

      const updatedAccount = await response.json();
      // This is a bit of a hack. Ideally the parent component would handle this state update.
      // For now, we can refresh the whole page or find a way to pass the update up.
      // Let's just optimistically close and let the main page refetch.
      onClose();
      window.location.reload(); // Simple way to ensure all data is fresh

    } catch (error) {
      console.error(error);
      alert("Failed to log spending. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cppColorClass = useMemo(() => {
    const val = parseFloat(cpp);
    if (isNaN(val)) return "";
    if (val < 1) return "text-red-600";
    if (val >= 2) return "text-green-600";
    return "";
  }, [cpp]);

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

        <div className="font-semibold text-lg my-4">
          Lifetime Points Earned: <span className="text-green-600">{totalEarned.toLocaleString()}</span>
        </div>

        <form onSubmit={handleSubmit} className="border-b pb-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Update Balance</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newBalance" className="text-right">
                New Balance
              </Label>
              <Input
                id="newBalance"
                type="text"
                value={newBalance}
                onChange={(e) => handleNumericInputChange(e.target.value, setNewBalance)}
                onBlur={(e) => handleBlur(e.target.value, setNewBalance)}
                placeholder="ex. 1,100 or 1.1k"
                className="col-span-1"
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

        <form onSubmit={handleSpendSubmit}>
          <h3 className="text-lg font-medium mb-4">Spend Points</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pointsUsed" className="text-right">Points Used</Label>
              <Input 
                id="pointsUsed" 
                type="text" 
                value={pointsUsed} 
                onChange={(e) => handleNumericInputChange(e.target.value, setPointsUsed)} 
                onBlur={(e) => handleBlur(e.target.value, setPointsUsed)}
                className="col-span-1" 
                placeholder="80,000 or 80k"
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spendMethod" className="text-right">Method</Label>
              <Select onValueChange={setSpendMethod} value={spendMethod}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer to Partner">Transfer to Partner</SelectItem>
                  <SelectItem value="Spent on Portal">Spent on Portal</SelectItem>
                  <SelectItem value="Cash Out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {spendMethod === 'Transfer to Partner' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="partnerName" className="text-right">Partner</Label>
                  <div className="col-span-3">
                    <Autocomplete value={partnerName} setValue={setPartnerName} options={allPartners} />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cpp" className="text-right">CPP</Label>
                  <Input id="cpp" type="number" value={cpp} onChange={(e) => setCpp(e.target.value)} className={`col-span-3 ${cppColorClass}`} placeholder="e.g., 1.8" />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Spending'}
            </Button>
          </DialogFooter>
        </form>

        {account.spending && account.spending.length > 0 && (
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Points Spending</h3>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                            <tr>
                                <th className="p-2 text-left font-semibold">Date</th>
                                <th className="p-2 text-right font-semibold">Points</th>
                                <th className="p-2 text-left font-semibold">Method</th>
                                <th className="p-2 text-left font-semibold">Partner</th>
                                <th className="p-2 text-right font-semibold">CPP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {account.spending.map((spend) => (
                                <tr key={spend.id} className="border-b last:border-b-0">
                                    <td className="p-2">{new Date(spend.date).toLocaleDateString()}</td>
                                    <td className="p-2 text-right">{spend.pointsUsed.toLocaleString()}</td>
                                    <td className="p-2 text-left">{spend.method}</td>
                                    <td className="p-2 text-left">{spend.partnerName || 'N/A'}</td>
                                    <td className="p-2 text-right">{spend.cpp ? `${spend.cpp.toFixed(2)}¢` : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Balance History</h3>
            <div className="max-h-48 overflow-y-auto border rounded-md">
                {sortedHistory.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                            <tr>
                                <th className="p-2 text-left font-semibold">Date</th>
                                <th className="p-2 text-right font-semibold">Balance</th>
                                <th className="p-2 text-right font-semibold">Change</th>
                                <th className="p-2 text-center font-semibold">Discard</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHistory.slice().reverse().map((entry, index, arr) => {
                                const previousEntry = arr[index + 1];
                                const change = previousEntry ? entry.balance - previousEntry.balance : entry.balance;
                                const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
                                
                                return (
                                    <tr key={entry.id} className="border-b last:border-b-0">
                                        <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="p-2 text-right">{entry.balance.toLocaleString()}</td>
                                        <td className={`p-2 text-right font-medium ${changeColor}`}>
                                            {change !== 0 ? `${change > 0 ? '+' : ''}${change.toLocaleString()}` : '–'}
                                        </td>
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
                                );
                            })}
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