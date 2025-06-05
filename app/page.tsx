"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { Account, NewAccountData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountCard } from "@/components/AccountCard";
import dynamic from "next/dynamic";
import { AccountDetailDialog } from "@/components/AccountDetailDialog";

// Dynamically import the MainProgressChart component
const DynamicMainProgressChart = dynamic(
  () => import("@/components/charts/MainProgressChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-lg text-muted-foreground">
        Loading overall progress chart...
      </div>
    ),
  }
);

// Placeholder for AccountDetailDialog - we'll create this component next
// const AccountDetailDialog = dynamic(() => import('@/components/AccountDetailDialog').then(mod => mod.AccountDetailDialog), { ssr: false });

export default function HomePage() {
  // State to hold the list of accounts
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null); // <--- New state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false); // <--- New state

  // Handler to add a new account
  const handleAddAccount = (newAccountData: NewAccountData) => {
    const newAccountWithHistory: Account = {
      ...newAccountData,
      id: crypto.randomUUID(), // Generate a simple unique ID
      history: [{ date: newAccountData.date, balance: newAccountData.balance }],
    };
    setAccounts((prevAccounts) => [...prevAccounts, newAccountWithHistory]);
    console.log("New account added:", newAccountWithHistory);
    // console.log("All accounts:", [...accounts, newAccountWithHistory]); // Keep for debugging if needed
  };

  const handleOpenAccountDetail = (accountId: string) => { // <--- Renamed and updated
    const accountToView = accounts.find(acc => acc.id === accountId);
    if (accountToView) {
      setSelectedAccountForDetail(accountToView);
      setIsDetailDialogOpen(true);
    }
  };

  const handleCloseDetailDialog = () => { // <--- New handler
    setIsDetailDialogOpen(false);
    setSelectedAccountForDetail(null);
  };

  const handleUpdateAccountHistory = (accountId: string, newBalance: number, newDate: string) => { // <--- New handler
    setAccounts(prevAccounts =>
      prevAccounts.map(acc => {
        if (acc.id === accountId) {
          const updatedHistory = [
            ...acc.history,
            { date: newDate, balance: newBalance },
          ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Keep history sorted

          return {
            ...acc,
            balance: newBalance, // Update current balance
            date: newDate,       // Update current date to the latest entry
            history: updatedHistory,
          };
        }
        return acc;
      })
    );
    // Optional: If the dialog should close after update, call handleCloseDetailDialog()
    // setIsDetailDialogOpen(false); 
    // setSelectedAccountForDetail(null);
  };

  // Calculate total balance for the table footer
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Points & Miles Dashboard</h1>
        <p className="text-muted-foreground">Manage your loyalty accounts and track your progress.</p>
      </header>

      <section id="add-account-section" className="mb-8">
        <AddAccountDialog onAccountAdd={handleAddAccount}>
          <Button
            className="transition-all duration-200 ease-in-out hover:scale-102 hover:shadow-lg"
          >
            Add New Account
          </Button>
        </AddAccountDialog>
      </section>

      <section id="summary-table-section" className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Accounts Overview</h2>
        {accounts.length === 0 ? (
          <div className="p-4 border rounded-lg bg-card text-card-foreground">
            No accounts added yet.
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your current mileage accounts.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Account Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.accountName}</TableCell>
                  <TableCell>{account.ownerName}</TableCell>
                  <TableCell className="text-right">{account.balance.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{totalBalance.toLocaleString()}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
        {/* For debugging, show current accounts: */}
        <pre className="mt-4 p-4 bg-muted rounded-md overflow-x-auto text-sm">
          {JSON.stringify(accounts, null, 2)}
        </pre>
      </section>

      <section id="account-cards-section" className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">My Accounts</h2>
        {accounts.length === 0 ? (
          <div className="p-4 border rounded-lg bg-card text-card-foreground">
            No accounts to display. Add one using the button above!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onOpenAccount={handleOpenAccountDetail} // <--- Updated prop
              />
            ))}
          </div>
        )}
      </section>

      <section id="progress-graph-section">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Overall Progress</h2>
        <div className="p-4 border rounded-lg bg-card text-card-foreground h-96">
          {accounts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-lg text-muted-foreground">
              Add accounts to see overall progress.
            </div>
          ) : (
            <DynamicMainProgressChart accounts={accounts} />
          )}
        </div>
      </section>

      {/* Render AccountDetailDialog */}
      {selectedAccountForDetail && ( 
        <AccountDetailDialog
          account={selectedAccountForDetail}
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          onUpdateHistory={handleUpdateAccountHistory}
        />
      )}
    </div>
  );
}
