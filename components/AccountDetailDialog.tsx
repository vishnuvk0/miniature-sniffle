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

// Placeholder for DetailedAccountChart - we'll create this later
const DynamicDetailedAccountChart = dynamic(
  () => import("./charts/DetailedAccountChart"), // Updated path to be relative
  {
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading chart...</div>,
  }
);


export interface AccountDetailDialogProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHistory: (accountId: string, newBalance: number, newDate: string) => void;
}

export function AccountDetailDialog({ account, isOpen, onClose, onUpdateHistory }: AccountDetailDialogProps) {
  const [newBalance, setNewBalance] = useState<string | number>("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    // When dialog opens with an account, prefill date and clear balance
    if (account && isOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setNewDate(`${year}-${month}-${day}`);
      setNewBalance(""); // Clear previous balance input
    }
  }, [account, isOpen]);

  if (!account) {
    return null; // Don't render if no account is selected
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numericBalance = typeof newBalance === 'string' ? parseFloat(newBalance) : newBalance;
    if (isNaN(numericBalance) || !newDate) {
      alert("Please enter a valid balance and date.");
      return;
    }
    onUpdateHistory(account.id, numericBalance, newDate);
    // Optionally close dialog after update:
    // onClose(); 
    // Or just reset form for another entry:
    setNewBalance("");
    // Keep newDate as is, or reset to today if preferred for multiple quick entries
  };
  
  const chartData = account.history.map(entry => ({
    name: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }), // Format for chart
    balance: entry.balance,
    originalDate: entry.date,
  }));


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl"> {/* Wider dialog for more content */}
        <DialogHeader>
          <DialogTitle>Account Details: {account.accountName}</DialogTitle>
          <DialogDescription>
            View history and update balance for {account.accountName} (owned by {account.ownerName}).
            Current Balance: {account.balance.toLocaleString()} (as of {new Date(account.date).toLocaleDateString()})
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 h-72"> {/* Container for detailed chart */}
          <DynamicDetailedAccountChart data={chartData} />
        </div>

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
                placeholder="e.g., 52000"
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
                            </tr>
                        </thead>
                        <tbody>
                            {account.history.slice().reverse().map((entry, index) => ( // Show newest first
                                <tr key={index} className="border-b last:border-b-0">
                                    <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="p-2 text-right">{entry.balance.toLocaleString()}</td>
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