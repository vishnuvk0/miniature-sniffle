"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Added for closing the dialog after submit
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewAccountData } from "@/lib/types"; // <--- MODIFIED IMPORT

// Define a type for the props, including the onAccountAdd callback
export interface AddAccountDialogProps {
  onAccountAdd: (accountData: NewAccountData) => void;
  children: React.ReactNode; // To wrap the trigger button
}

// REMOVE LOCAL NewAccountData IF IT EXISTS (it shouldn't based on previous code)
// export interface NewAccountData {
//   accountName: string;
//   balance: number;
//   ownerName: string;
//   date: string;
// }

export function AddAccountDialog({ onAccountAdd, children }: AddAccountDialogProps) {
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState<number | string>(""); // Allow string for input flexibility
  const [ownerName, setOwnerName] = useState("me");
  const [date, setDate] = useState("");
  const [isOpen, setIsOpen] = useState(false); // To control dialog visibility

  useEffect(() => {
    // Prefill date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numericBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(numericBalance)) {
      alert("Please enter a valid number for the balance.");
      return;
    }
    const newAccount: NewAccountData = {
      accountName,
      balance: numericBalance,
      ownerName,
      date,
    };
    onAccountAdd(newAccount);
    // Reset form fields
    setAccountName("");
    setBalance("");
    setOwnerName("me");
    setIsOpen(false); // Close the dialog after successful submission
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Mileage Account</DialogTitle>
          <DialogDescription>
            Enter the details for your new mileage or points account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountName" className="text-right">
                Account Name
              </Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., BA Avios, AA Miles"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <Input
                id="balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 50000"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ownerName" className="text-right">
                Name
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 