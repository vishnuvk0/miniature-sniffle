'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HistoryEntry, Account } from '@/lib/types';
import { formatNumberWithCommas, parsePoints } from '@/lib/utils';
import { DatePicker } from './ui/date-picker';

export interface EditHistoryEntryDialogProps {
  entry: HistoryEntry | null;
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (accountId: string, historyId: string, newBalance: number, newDate: string) => Promise<void>;
}

export function EditHistoryEntryDialog({ entry, account, isOpen, onClose, onUpdate }: EditHistoryEntryDialogProps) {
  const [newBalance, setNewBalance] = useState('');
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setNewBalance(formatNumberWithCommas(entry.balance));
      setNewDate(new Date(entry.date));
    }
  }, [entry]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account || !entry || !newDate) return;

    setIsSubmitting(true);
    try {
      const numericBalance = parsePoints(newBalance);
      await onUpdate(account.id, entry.id, numericBalance, newDate.toISOString());
      onClose();
    } catch (error) {
      console.error('Failed to update history entry:', error);
      alert('Failed to update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !entry || !account) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit History Entry</DialogTitle>
          <DialogDescription>
            Editing entry for <span className="font-semibold">{account.name}</span>.
            Be aware that changing this may affect subsequent balance entries.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-balance" className="text-right">
              Balance
            </Label>
            <Input
              id="edit-balance"
              type="text"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              onBlur={(e) => setNewBalance(formatNumberWithCommas(parsePoints(e.target.value)))}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <DatePicker date={newDate} setDate={setNewDate} disableFuture />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 