"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewAccountData } from "@/lib/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plane, Building, CreditCard } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  ACCOUNT_CATEGORIES,
  AIRLINE_PROGRAMS,
  HOTEL_PROGRAMS,
  CREDIT_CARD_PROGRAMS,
  CREDIT_CARDS_BY_PROGRAM
} from "@/lib/constants";

export interface AddAccountDialogProps {
  onAccountAdd: (accountData: NewAccountData) => void;
  children: React.ReactNode;
}

export function AddAccountDialog({ onAccountAdd, children }: AddAccountDialogProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [balance, setBalance] = useState<string>("");
  const [date, setDate] = useState("");
  const [cardOpenDate, setCardOpenDate] = useState("");
  const [annualFee, setAnnualFee] = useState("");
  const [signupBonus, setSignupBonus] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const formatNumberInput = (value: string): string => {
    if (!value) return '';
    
    // Convert to lowercase and trim whitespace
    const cleaned = value.trim().toLowerCase();
    
    // If it ends with 'k', handle it specially
    if (cleaned.endsWith('k')) {
      // Remove the 'k' and any commas, then parse
      const numPart = cleaned.slice(0, -1).replace(/,/g, '');
      const num = parseInt(numPart);
      if (!isNaN(num)) {
        return (num * 1000).toString();
      }
    }
    
    // For regular numbers, just remove any non-numeric characters except commas
    return value.replace(/[^0-9,]/g, '');
  };

  const parseBonus = (bonusStr: string): number => {
    if (!bonusStr) return 0;
    
    // Remove any commas and convert to number
    const numStr = bonusStr.replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  };

  const resetState = () => {
    setStep(1);
    setCategory(null);
    setName("");
    setCard("");
    setBalance("");
    setDate(new Date().toISOString().split('T')[0]);
    setCardOpenDate("");
    setAnnualFee("");
    setSignupBonus("");
  };

  const handleClose = () => {
    setIsOpen(false);
    // Delay resetting state to allow for closing animation
    setTimeout(resetState, 200);
  };
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !name) return;

    const newAccount: NewAccountData = {
      category,
      name,
      balance: parseBonus(balance),
      date,
      ...(category === ACCOUNT_CATEGORIES.CREDIT_CARD && {
        card,
        cardOpenDate,
        annualFee: parseFloat(annualFee) || 0,
        signupBonus: parseBonus(signupBonus),
      }),
    };

    onAccountAdd(newAccount);
    handleClose();
  };
  
  const Autocomplete = ({ value, setValue, options }: { value: string, setValue: (val: string) => void, options: string[]}) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between"
            >
              {value || `Select ${category}...`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder={`Search ${category}...`} />
              <CommandEmpty>No {category?.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
    );
  };
  
  const renderStepOne = () => (
    <>
      <DialogHeader>
        <DialogTitle>Add New Account</DialogTitle>
        <DialogDescription>Select the category of the points or miles account you want to add.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Button 
          variant="outline" 
          className="h-16 text-lg relative overflow-hidden group" 
          onClick={() => { setCategory(ACCOUNT_CATEGORIES.AIRLINE); setStep(2); }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-blue-200 to-blue-50 animate-gradient-x opacity-30 group-hover:opacity-60 transition-opacity"/>
          <Plane className="absolute left-4 top-1/2 -translate-y-1/2 h-20 w-20 text-blue-400/90"/> 
          <span className="relative z-10">Airline</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 text-lg relative overflow-hidden group" 
          onClick={() => { setCategory(ACCOUNT_CATEGORIES.HOTEL); setStep(2); }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-red-400 animate-gradient-x opacity-20 group-hover:opacity-30 transition-opacity"/>
          <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 text-amber-400/70"/> 
          <span className="relative z-10">Hotel</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-16 text-lg relative overflow-hidden group" 
          onClick={() => { setCategory(ACCOUNT_CATEGORIES.CREDIT_CARD); setStep(2); }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-800 animate-gradient-x opacity-20 group-hover:opacity-30 transition-opacity"/>
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400/70"/> 
          <span className="relative z-10">Credit Card</span>
        </Button>
      </div>
    </>
  );

  const renderStepTwo = () => {
    let options: string[] = [];
    if (category === ACCOUNT_CATEGORIES.AIRLINE) options = AIRLINE_PROGRAMS;
    if (category === ACCOUNT_CATEGORIES.HOTEL) options = HOTEL_PROGRAMS;
    if (category === ACCOUNT_CATEGORIES.CREDIT_CARD) options = CREDIT_CARD_PROGRAMS;

    return (
      <>
        <DialogHeader>
          <DialogTitle>Select {category}</DialogTitle>
          <DialogDescription>Choose the loyalty program for your new account.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <Input 
              placeholder={`Search ${category} programs...`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            {name.length >= 2 && (
              <div className="max-h-48 overflow-y-auto">
                {options
                  .filter(option => 
                    option.toLowerCase().includes(name.toLowerCase())
                  )
                  .map(option => (
                    <Button
                      key={option}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setName(option)}
                    >
                      {option}
                    </Button>
                  ))
                }
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
          <Button onClick={() => setStep(3)} disabled={!name || name === 'Other'}>Next</Button>
        </DialogFooter>
      </>
    );
  };

  const renderStepThree = () => (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add Details for {name}</DialogTitle>
        <DialogDescription>Enter the current balance and other relevant details.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="accountName" className="text-right">Program</Label>
          <Input id="accountName" value={name} disabled className="col-span-3"/>
        </div>
        {category === ACCOUNT_CATEGORIES.CREDIT_CARD && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="card" className="text-right">Card</Label>
              <div className="col-span-3">
                <Autocomplete value={card} setValue={setCard} options={CREDIT_CARDS_BY_PROGRAM[name] || ['Other']} />
              </div>
            </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="balance" className="text-right">Balance</Label>
          <Input 
            id="balance" 
            value={balance} 
            onChange={(e) => setBalance(formatNumberInput(e.target.value))} 
            placeholder="e.g., 50,000 or 50k" 
            className="col-span-3" 
            autoComplete="off" 
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="date" className="text-right">As of Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" required/>
        </div>
        {category === ACCOUNT_CATEGORIES.CREDIT_CARD && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cardOpenDate" className="text-right">Open Date</Label>
              <Input 
                id="cardOpenDate" 
                type="month" 
                value={cardOpenDate}
                placeholder="MM/YY" 
                onChange={(e) => setCardOpenDate(e.target.value)} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="annualFee" className="text-right">Annual Fee</Label>
              <Input id="annualFee" type="number" value={annualFee} onChange={(e) => setAnnualFee(e.target.value)} placeholder="e.g., 550" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="signupBonus" className="text-right">SUB</Label>
              <Input 
                id="signupBonus" 
                value={signupBonus} 
                onChange={(e) => setSignupBonus(formatNumberInput(e.target.value))} 
                placeholder="e.g., 90k" 
                className="col-span-3" 
                autoComplete="off"
              />
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
        <Button type="submit">Add Account</Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleClose} onEscapeKeyDown={handleClose}>
        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
      </DialogContent>
    </Dialog>
  );
} 