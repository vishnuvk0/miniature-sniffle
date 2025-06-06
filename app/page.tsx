"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { AddAccountDialog } from "@/components/AddAccountDialog";
import { Account, NewAccountData } from "@/lib/types";
import { AccountCard } from "@/components/AccountCard";
import dynamic from "next/dynamic";
import { AccountDetailDialog } from "@/components/AccountDetailDialog";
import { PlusCircle, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";

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

// Placeholder for ReasonForDecreaseDialog - we'll create and import this next
const DynamicReasonForDecreaseDialog = dynamic(
  () => import("@/components/ReasonForDecreaseDialog"), // Assuming this path
  { ssr: false, loading: () => null } // No specific loading for this dialog, it's quick
);

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingUpdateInfo, setPendingUpdateInfo] = useState<{
    accountId: string;
    newBalance: number;
    newDate: string;
    oldBalance: number; // Store old balance to confirm decrease
  } | null>(null);

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }

    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    if (session) {
      fetchAccounts();
    }
  }, [session, status, router]);

  // Handler to add a new account
  const handleAddAccount = async (newAccountData: NewAccountData) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountData),
      });
      if (!response.ok) {
        throw new Error('Failed to create account');
      }
      const newAccount = await response.json();
      setAccounts((prevAccounts) => [...prevAccounts, newAccount]);
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleOpenAccountDetail = (accountId: string) => {
    const accountToView = accounts.find(acc => acc.id === accountId);
    if (accountToView) {
      setSelectedAccountForDetail(accountToView);
      setIsDetailDialogOpen(true);
    }
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedAccountForDetail(null);
  };

  const handleUpdateAccountHistory = async (accountId: string, newBalance: number, newDate: string, reason?: string) => {
    const accountToUpdate = accounts.find((acc) => acc.id === accountId);
    if (!accountToUpdate) {
      console.error("Account not found for update:", accountId);
      return;
    }
  
    const updateDate = new Date(newDate);

    // Find the latest history entry with a date *before* the new entry's date.
    const previousEntry = accountToUpdate.history
      .filter(entry => new Date(entry.date) < updateDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const referenceBalance = previousEntry ? previousEntry.balance : 0; // If no previous entry, baseline is 0
  
    // Only show the reason dialog if it's a true chronological decrease.
    if (newBalance < referenceBalance && !reason) {
      setPendingUpdateInfo({ accountId, newBalance, newDate, oldBalance: referenceBalance });
      setIsReasonDialogOpen(true);
      return;
    }
  
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance, date: newDate, reason }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update account');
      }
  
      const updatedAccount = await response.json();
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => (acc.id === accountId ? updatedAccount : acc))
      );
      setSelectedAccountForDetail(updatedAccount);
      setIsReasonDialogOpen(false);
      setPendingUpdateInfo(null);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleConfirmUpdateWithReason = (reason: string) => {
    if (!pendingUpdateInfo) return;
    const { accountId, newBalance, newDate } = pendingUpdateInfo;
    handleUpdateAccountHistory(accountId, newBalance, newDate, reason);
  };

  const handleCancelReasonDialog = () => {
    setIsReasonDialogOpen(false);
    setPendingUpdateInfo(null);
  };

  const handleDeleteHistoryEntry = async (accountId: string, historyId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/history/${historyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete history entry');
      }

      const updatedAccount = await response.json();
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => (acc.id === accountId ? updatedAccount : acc))
      );
      setSelectedAccountForDetail(updatedAccount);
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      setAccounts((prevAccounts) => prevAccounts.filter((acc) => acc.id !== accountId));
      if (selectedAccountForDetail?.id === accountId) {
        setSelectedAccountForDetail(null);
        setIsDetailDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <div className="space-y-1">
            <h1 className="text-3xl font-inter font-bold tracking-tight text-black-600">
              {(() => {
                const hour = new Date().getHours();
                const firstName = session.user?.name?.split(" ")[0] || "User";
                const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
                
                if (hour < 12) return `Good morning, ${formattedName}`;
                if (hour < 18) return `Welcome back, ${formattedName}`;
                return `Good evening, ${formattedName}`;
              })()}
            </h1>
            <p className="text-sm text-muted-foreground">Dive in to your award goals.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </header>

      <main>
        <section id="add-account-section" className="mb-8">
          <AddAccountDialog onAccountAdd={handleAddAccount}>
            <Button
              className="transition-all duration-200 ease-in-out hover:scale-108 hover:shadow-lg cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
            </Button>
          </AddAccountDialog>
        </section>

        <section id="overview-chart-section" className="mb-12">
          <h2 className="text-2xl font-semibold tracking-tight text-left mb-4">Overall Progress</h2>
          <Card className="h-[350px] p-4">
            <DynamicMainProgressChart accounts={accounts} />
          </Card>
        </section>

        <section id="accounts-grid-section">
          <h2 className="text-2xl font-semibold tracking-tight text-left mb-6">Your Accounts</h2>
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onOpenAccount={handleOpenAccountDetail}
                  onDeleteAccount={handleDeleteAccount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-medium">No accounts yet.</h3>
              <p className="text-muted-foreground mt-2">
                Click "Add New Account" to get started.
              </p>
            </div>
          )}
        </section>
      </main>

      {selectedAccountForDetail && (
        <AccountDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
          account={selectedAccountForDetail}
          onUpdateHistory={handleUpdateAccountHistory}
          onDeleteHistoryEntry={handleDeleteHistoryEntry}
        />
      )}

      {isReasonDialogOpen && pendingUpdateInfo && (
        <DynamicReasonForDecreaseDialog
          isOpen={isReasonDialogOpen}
          onClose={handleCancelReasonDialog}
          onConfirm={handleConfirmUpdateWithReason}
          accountName={accounts.find(acc => acc.id === pendingUpdateInfo.accountId)?.name || 'Unknown Account'}
          oldBalance={pendingUpdateInfo.oldBalance}
          newBalance={pendingUpdateInfo.newBalance}
        />
      )}
    </div>
  );
}
