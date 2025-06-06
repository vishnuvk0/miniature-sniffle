'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Account, SpendingTransaction } from '@/lib/types';
import { formatNumberWithCommas, parsePoints } from '@/lib/utils';
import { DatePicker } from './ui/date-picker';
import { Autocomplete } from './Autocomplete';
import { ACCOUNT_CATEGORIES, AIRLINE_PROGRAMS, HOTEL_PROGRAMS, CREDIT_CARD_PROGRAMS } from "@/lib/constants";

export interface EditSpendTransactionDialogProps {
  transaction: SpendingTransaction | null;
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdate: (updatedAccounts: Account[]) => void;
}

export function EditSpendTransactionDialog({
  transaction,
  account,
  isOpen,
  onClose,
  onAccountsUpdate,
}: EditSpendTransactionDialogProps) {
  const [pointsUsed, setPointsUsed] = useState('');
  const [spendDate, setSpendDate] = useState<Date | undefined>();
  const [spendMethod, setSpendMethod] = useState<string | undefined>();
  const [partnerName, setPartnerName] = useState('');
  const [transferBonus, setTransferBonus] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setPointsUsed(formatNumberWithCommas(transaction.pointsUsed));
      setSpendDate(new Date(transaction.date));
      setSpendMethod(transaction.method);
      setPartnerName(transaction.partnerName || '');
      setTransferBonus(String(transaction.transferBonus || '0'));
    }
  }, [transaction]);

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!account || !transaction) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/accounts/${account.id}/spend/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsUsed: parsePoints(pointsUsed),
          method: spendMethod,
          partnerName: spendMethod === 'Transfer to Partner' ? partnerName : undefined,
          transferBonus: spendMethod === 'Transfer to Partner' ? parseInt(transferBonus, 10) : 0,
          date: spendDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      const updatedAccounts = await response.json();
      onAccountsUpdate(updatedAccounts);
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allPartners = useMemo(() => {
    const combined = [...AIRLINE_PROGRAMS, ...HOTEL_PROGRAMS, ...CREDIT_CARD_PROGRAMS];
    return [...new Set(combined)].sort();
  }, []);

  const spendMethodOptions = useMemo(() => {
    if (!account) return [];
    switch (account.category) {
      case ACCOUNT_CATEGORIES.AIRLINE: return [{ value: "Redeemed for Flight", label: "Redeemed for Flight" }];
      case ACCOUNT_CATEGORIES.HOTEL: return [{ value: "Redeemed for Hotel", label: "Redeemed for Hotel" }];
      case ACCOUNT_CATEGORIES.CREDIT_CARD:
      default:
        return [
          { value: "Transfer to Partner", label: "Transfer to Partner" },
          { value: "Spent on Portal", label: "Spent on Portal" },
          { value: "Cash Out", label: "Cash Out" },
        ];
    }
  }, [account]);

  if (!isOpen || !transaction || !account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Spending Transaction</DialogTitle>
          <DialogDescription>
            Update the details for this spend on your {account.name} account.
          </DialogDescription>
        </DialogHeader>
        <form id="edit-spend-form" onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="spendDate" className="text-right">Date</Label>
              <div className="col-span-3">
                <DatePicker date={spendDate} setDate={setSpendDate} disableFuture />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pointsUsed" className="text-right">Points</Label>
              <Input
                id="pointsUsed"
                value={pointsUsed}
                onChange={(e) => setPointsUsed(e.target.value)}
                onBlur={(e) => setPointsUsed(formatNumberWithCommas(parsePoints(e.target.value)))}
                className="col-span-3"
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
                    <Autocomplete value={partnerName} setValue={setPartnerName} options={allPartners} formId="edit-spend-form" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="transferBonus" className="text-right">Bonus</Label>
                  <Input
                    id="transferBonus"
                    type="number"
                    value={transferBonus}
                    onChange={(e) => setTransferBonus(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 30"
                  />
                </div>
              </>
            )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 