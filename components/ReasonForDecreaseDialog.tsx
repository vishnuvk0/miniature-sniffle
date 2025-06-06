'use client';

import { useState, useEffect } from 'react'; // Added useEffect for potential future use
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface ReasonForDecreaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  accountName: string;
  oldBalance: number;
  newBalance: number;
}

const reasonOptions: { value: string; label: string }[] = [
  { value: 'transferred_to_partner', label: 'Transferred to partner' },
  { value: 'flight', label: 'Redeemed for Flight' },
  { value: 'hotel', label: 'Redeemed for Hotel' },
  { value: 'other', label: 'Other' }
];

export function ReasonForDecreaseDialog({
  isOpen,
  onClose,
  onConfirm,
  accountName,
  oldBalance,
  newBalance,
}: ReasonForDecreaseDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>(reasonOptions[0]?.value || '');

  // Reset selected reason when dialog is reopened for a new update
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(reasonOptions[0]?.value || '');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
    }
    // No alert needed if button is disabled or if default selection is acceptable
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Balance Decrease Detected</DialogTitle>
          <DialogDescription>
            The balance for <span className="font-semibold">{accountName}</span> went from{' '}
            <span className="font-semibold">{oldBalance.toLocaleString()}</span> to{' '}
            <span className="font-semibold">{newBalance.toLocaleString()}</span>.
            Please select a reason for this change.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedReason} // Controlled component
            onValueChange={(value: string) => setSelectedReason(value)}
            className="space-y-2"
            defaultValue={reasonOptions[0]?.value} // Set a default for accessibility
          >
            {reasonOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`reason-${option.value}`} />
                <Label htmlFor={`reason-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}> {/* Ensure onClose is called */}
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!selectedReason}>
            Confirm Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReasonForDecreaseDialog; 