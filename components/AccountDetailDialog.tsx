'use client';

import { useState, useEffect, FormEvent, useMemo } from "react";
import { Account, HistoryEntry, SpendingTransaction } from "@/lib/types";
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
import { Trash2, Pencil } from 'lucide-react';
import { TimeRange, TimeRangeFilter } from "./charts/TimeRangeFilter";
import { ACCOUNT_CATEGORIES, AIRLINE_PROGRAMS, HOTEL_PROGRAMS, CREDIT_CARD_PROGRAMS } from "@/lib/constants";
import { Autocomplete } from "./Autocomplete";
import { formatNumberWithCommas, parsePoints } from "@/lib/utils";
import { EditHistoryEntryDialog } from "./EditHistoryEntryDialog";
import { DatePicker } from "./ui/date-picker";
import DetailedAccountChart from "./charts/DetailedAccountChart";
import { EditSpendTransactionDialog } from "./EditSpendTransactionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  onAccountUpdate: (updatedAccount: Account) => void;
  onAccountsUpdate: (updatedAccounts: Account[]) => void;
  onUpdateHistory: (accountId: string, newBalance: number, newDate: string | Date, reason?: string) => void;
  onDeleteHistoryEntry: (accountId: string, historyId: string) => void;
  onDeleteSpend: (accountId: string, spendId: string) => Promise<void>;
  onEditHistoryEntry: (accountId: string, historyId: string, newBalance: number, newDate: string) => Promise<void>;
}

export function AccountDetailDialog({ 
  account, 
  isOpen, 
  onClose, 
  onAccountUpdate,
  onAccountsUpdate,
  onUpdateHistory, 
  onDeleteHistoryEntry,
  onDeleteSpend,
  onEditHistoryEntry,
}: AccountDetailDialogProps) {
  const [customName, setCustomName] = useState(account?.customName || "");
  const [accountIdNumber, setAccountIdNumber] = useState(account?.accountIdNumber || "");
  const [notes, setNotes] = useState(account?.notes || "");
  const [newBalance, setNewBalance] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");
  const [pointsUsed, setPointsUsed] = useState("");
  const [spendMethod, setSpendMethod] = useState<string | undefined>(undefined);
  const [partnerName, setPartnerName] = useState("");
  const [transferBonus, setTransferBonus] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spendDate, setSpendDate] = useState<Date | undefined>(new Date());
  const [spendNotes, setSpendNotes] = useState("");
  const [historyEntryToEdit, setHistoryEntryToEdit] = useState<HistoryEntry | null>(null);
  const [spendEntryToEdit, setSpendEntryToEdit] = useState<SpendingTransaction | null>(null);

  // State for Earn Points form
  const [earnDate, setEarnDate] = useState<Date | undefined>(new Date());
  const [pointsEarned, setPointsEarned] = useState("");
  const [earnReason, setEarnReason] = useState("");
  const [customEarnReason, setCustomEarnReason] = useState("");
  const [earnNotes, setEarnNotes] = useState("");

  useEffect(() => {
    if (account && isOpen) {
      setNewDate(new Date());
      setSpendDate(new Date());
      setNewBalance("");
      setTimeRange("ALL"); // Reset timerange on dialog open
      setPointsUsed("");
      setSpendMethod(undefined);
      setPartnerName("");
      setTransferBonus("0");
      setHistoryEntryToEdit(null);
      setSpendEntryToEdit(null);
      setCustomName(account?.customName || "");
      setAccountIdNumber(account?.accountIdNumber || "");
      setNotes(account?.notes || "");

      // Reset earn form state
      setEarnDate(new Date());
      setPointsEarned("");
      setEarnReason("");
      setCustomEarnReason("");
      setEarnNotes("");

      // Set initial spend method based on account category
      if (account.category === ACCOUNT_CATEGORIES.AIRLINE) {
        setSpendMethod("Redeemed for Flight");
      } else if (account.category === ACCOUNT_CATEGORIES.HOTEL) {
        setSpendMethod("Redeemed for Hotel");
      } else if (account.category === ACCOUNT_CATEGORIES.CREDIT_CARD) {
        setSpendMethod("Transfer to Partner");
      } else {
        setSpendMethod(undefined);
      }
    }
  }, [account, isOpen]);

  const handleDetailsUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      const response = await fetch(`/api/accounts/${account.id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customName, accountIdNumber, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update account details');
      }

      const updatedAccount = await response.json();
      onAccountUpdate(updatedAccount);
      alert('Account details updated successfully!');
    } catch (error) {
      console.error('Error updating account details:', error);
      alert('Failed to update details. Please try again.');
    }
  };

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

  const spendMethodOptions = useMemo(() => {
    if (!account) return [];
    switch (account.category) {
      case ACCOUNT_CATEGORIES.AIRLINE:
        return [
          { value: "Redeemed for Flight", label: "Redeemed for Flight" },
          { value: "Transferred to another member", label: "Transferred to another member" },
        ];
      case ACCOUNT_CATEGORIES.HOTEL:
        return [
          { value: "Redeemed for Hotel", label: "Redeemed for Hotel" },
          { value: "Transferred to another member", label: "Transferred to another member" },
        ];
      case ACCOUNT_CATEGORIES.CREDIT_CARD:
      default:
        return [
          { value: "Transfer to Partner", label: "Transfer to Partner" },
          { value: "Spent on Portal", label: "Spent on Portal" },
          { value: "Cash Out", label: "Cash Out" },
        ];
    }
  }, [account]);

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
  
  const chartData = useMemo(() => {
    let data = sortedHistory
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

    if (data.length > 0) {
      const today = new Date();
      const lastDataPoint = data[data.length - 1];
      const lastDate = new Date(lastDataPoint.originalDate);

      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      if (lastDateOnly < todayDateOnly) {
        data.push({
          ...lastDataPoint,
          name: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          originalDate: today.toISOString(),
        });
      }
    }
    
    if (data.length === 1) {
      const singlePoint = data[0];
      const singleDate = new Date(singlePoint.originalDate);
      const dayBefore = new Date(singleDate);
      dayBefore.setDate(dayBefore.getDate() - 1);

      data.unshift({
        ...singlePoint,
        name: dayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        originalDate: dayBefore.toISOString(),
      });
    }

    return data;
  }, [sortedHistory, timeRange]);

  const handleSpendSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account) return;

    if (!pointsUsed || !spendMethod || !spendDate) {
      alert("Please ensure Points, Method, and Date are all filled out.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsUsed: parsePoints(pointsUsed),
          reason: spendMethod,
          partnerName: spendMethod === 'Transfer to Partner' ? partnerName : undefined,
          transferBonus: spendMethod === 'Transfer to Partner' ? parseInt(transferBonus, 10) : 0,
          date: spendDate?.toISOString(),
          notes: spendNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log spending');
      }
      
      const updatedAccounts = await response.json();
      onAccountsUpdate(updatedAccounts);
      
      // Reset form on success
      setPointsUsed("");
      setSpendMethod(undefined);
      setPartnerName("");
      setTransferBonus("0");
      setSpendDate(new Date());
      setSpendNotes("");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to log spending. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEarnSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account) return;

    const finalReason = earnReason === 'Other' ? customEarnReason : earnReason;
    if (!pointsEarned || !finalReason || !earnDate) {
      alert("Please ensure Points, Reason, and Date are all filled out.");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsEarned: parsePoints(pointsEarned),
          reason: finalReason,
          notes: earnNotes,
          date: earnDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log earning');
      }
      
      const updatedAccount = await response.json();
      onAccountUpdate(updatedAccount);
      
      // Reset form on success
      setPointsEarned("");
      setEarnReason("");
      setCustomEarnReason("");
      setEarnNotes("");
      setEarnDate(new Date());

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to log earning. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferBonusOptions = [0, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Details: {account.customName || account.name}</DialogTitle>
          <DialogDescription>
            Current Balance: {account.balance.toLocaleString()} (as of {new Date(account.date).toLocaleDateString()})
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="spend" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="spend">Spend Points</TabsTrigger>
            <TabsTrigger value="earn">Earn Points</TabsTrigger>
          </TabsList>
          <TabsContent value="spend">
            <div className="border-t pt-6 mt-6">
              <form id="spend-points-form" onSubmit={handleSpendSubmit}>
                <h3 className="text-lg font-medium mb-4">Spend Points</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="spendDate" className="text-right">Date</Label>
                    <div className="col-span-3">
                      <DatePicker date={spendDate} setDate={setSpendDate} disableFuture />
                    </div>
                  </div>
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
                        {spendMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
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
                        <Label htmlFor="transferBonus" className="text-right">Bonus</Label>
                        <Select onValueChange={setTransferBonus} value={String(transferBonus)}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a transfer bonus..." />
                          </SelectTrigger>
                          <SelectContent>
                            {transferBonusOptions.map(bonus => (
                              <SelectItem key={bonus} value={String(bonus)}>{bonus}%</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="spendNotes" className="text-right">Notes</Label>
                    <textarea
                      id="spendNotes"
                      value={spendNotes}
                      onChange={(e) => setSpendNotes(e.target.value)}
                      className="col-span-3 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Optional: add any notes about this transaction"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging...' : 'Log Spending'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </TabsContent>
          <TabsContent value="earn">
            <div className="border-t pt-6 mt-6">
               <h3 className="text-lg font-medium mb-4">Earn Points</h3>
                <form id="earn-points-form" className="space-y-4" onSubmit={handleEarnSubmit}>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="earnDate" className="text-right">Date</Label>
                    <div className="col-span-3">
                      <DatePicker date={earnDate} setDate={setEarnDate} disableFuture />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="pointsEarned" className="text-right">Points Earned</Label>
                    <Input
                      id="pointsEarned"
                      type="text"
                      value={pointsEarned}
                      onChange={(e) => handleNumericInputChange(e.target.value, setPointsEarned)}
                      onBlur={(e) => handleBlur(e.target.value, setPointsEarned)}
                      className="col-span-3"
                      placeholder="e.g., 5,000 or 5k"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="earnReason" className="text-right">Reason</Label>
                    <Select onValueChange={setEarnReason} value={earnReason}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Credit card sign up bonus">Credit card sign up bonus</SelectItem>
                        <SelectItem value="Credit card spending">Credit card spending</SelectItem>
                        <SelectItem value="Flight">Flight</SelectItem>
                        <SelectItem value="Hotel stay">Hotel stay</SelectItem>
                        <SelectItem value="Rental car">Rental car</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {earnReason === 'Other' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="customEarnReason" className="text-right">Details</Label>
                      <Input
                        id="customEarnReason"
                        value={customEarnReason}
                        onChange={(e) => setCustomEarnReason(e.target.value)}
                        className="col-span-3"
                        placeholder="Please specify"
                        required
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="earnNotes" className="text-right">Notes</Label>
                    <textarea
                      id="earnNotes"
                      value={earnNotes}
                      onChange={(e) => setEarnNotes(e.target.value)}
                      className="col-span-3 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Optional: add any notes about this transaction"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Logging...' : 'Log Earning'}
                    </Button>
                  </DialogFooter>
                </form>
            </div>
         </TabsContent>
        </Tabs>
        
        <div className="my-4 h-72">
          <DetailedAccountChart data={chartData} />
        </div>
        <TimeRangeFilter value={timeRange} onValueChange={setTimeRange} />

        <form onSubmit={handleDetailsUpdate} className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">Edit Account Info</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customName" className="text-left">Custom Name</Label>
              <Input id="customName" value={customName} onChange={(e) => setCustomName(e.target.value)} className="col-span-3" placeholder="e.g., My Personal Amex" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">Account ID</Label>
              <Input id="accountId" value={accountIdNumber} onChange={(e) => setAccountIdNumber(e.target.value)} className="col-span-3" placeholder="Membership/Account Number" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Any notes, reminders, or links..." />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Save Details</Button>
          </DialogFooter>
        </form>

        <div className="font-semibold text-lg my-4">
          Lifetime Points Earned: <span className="text-green-600">{totalEarned.toLocaleString()}</span>
        </div>

        <form onSubmit={handleSubmit} className="border-b pb-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Update Balance</h3>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newBalance" className="text-left">
                New/Past Balance Amount
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
              <div className="col-span-2">
                <DatePicker date={newDate} setDate={setNewDate} disableFuture />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Update Balance</Button>
          </DialogFooter>
        </form>

        {account.spending && account.spending.length > 0 && (
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted">
                            <tr>
                                <th className="p-2 text-left font-semibold">Date</th>
                                <th className="p-2 text-right font-semibold">Amount</th>
                                <th className="p-2 text-left font-semibold">Reason</th>
                                <th className="p-2 text-left font-semibold">Notes</th>
                                <th className="p-2 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {account.spending.map((tx) => (
                                <tr key={tx.id} className="border-b last:border-b-0">
                                    <td className="p-2">{new Date(tx.date).toLocaleDateString()}</td>
                                    <td className={`p-2 text-right font-medium ${tx.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'EARN' ? '+' : '-'}{tx.pointsUsed.toLocaleString()}
                                    </td>
                                    <td className="p-2 text-left">{tx.reason}</td>
                                    <td className="p-2 text-left">{tx.notes || 'N/A'}</td>
                                    <td className="p-2 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Edit transaction"
                                        onClick={() => setSpendEntryToEdit(tx)}
                                        type="button"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteSpend(account.id, tx.id)}
                                        aria-label="Delete transaction"
                                        className="text-red-500 hover:text-red-700"
                                        type="button"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </td>
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
                                <th className="p-2 text-center font-semibold">Actions</th>
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
                                                aria-label="Edit history entry"
                                                onClick={() => setHistoryEntryToEdit(entry)}
                                                type="button"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteHistoryEntry(account.id, entry.id)}
                                                aria-label="Delete history entry"
                                                className="text-red-500 hover:text-red-700"
                                                type="button"
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

        {historyEntryToEdit && (
            <EditHistoryEntryDialog
                isOpen={!!historyEntryToEdit}
                onClose={() => setHistoryEntryToEdit(null)}
                account={account}
                entry={historyEntryToEdit}
                onUpdate={onEditHistoryEntry}
            />
        )}

        {spendEntryToEdit && (
            <EditSpendTransactionDialog
                isOpen={!!spendEntryToEdit}
                onClose={() => setSpendEntryToEdit(null)}
                account={account}
                transaction={spendEntryToEdit}
                onAccountsUpdate={onAccountsUpdate}
            />
        )}

      </DialogContent>
    </Dialog>
  );
} 