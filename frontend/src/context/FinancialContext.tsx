import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Category, Transaction, NetWorthSummary } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface FinancialContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  netWorth: NetWorthSummary;
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'userId'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [accRes, txRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/transactions'),
        api.get('/categories'),
      ]);

      // Normalize Account fields to camelCase if needed
      const mappedAccounts: Account[] = accRes.data.map((a: any) => ({
        id: a.id,
        userId: a.user?.id || 1,
        name: a.name,
        accountType: a.accountType,
        currency: a.currency,
        currentBalance: Number(a.currentBalance),
        institutionName: a.institutionName,
        accountNumberLast4: a.accountNumberLast4,
        creditLimit: a.creditLimit ? Number(a.creditLimit) : undefined,
        billingCycleDay: a.billingCycleDay,
        paymentDueDay: a.paymentDueDay,
        interestRateApr: a.interestRateApr ? Number(a.interestRateApr) : undefined,
        investmentType: a.investmentType,
        isActive: a.isActive ?? true,
      }));

      // Normalize Transaction fields
      const mappedTransactions: Transaction[] = txRes.data.map((t: any) => ({
        id: t.id,
        userId: t.user?.id || 1,
        transactionType: t.transactionType,
        amount: Number(t.amount),
        transactionDate: t.transactionDate,
        sourceAccountId: t.sourceAccount?.id,
        destinationAccountId: t.destinationAccount?.id,
        categoryId: t.category?.id,
        description: t.description,
        payeeMerchant: t.payeeMerchant,
        status: t.status,
        referenceId: t.referenceId,
      }));

      // Normalize Category fields
      const mappedCategories: Category[] = catRes.data.map((c: any) => ({
        id: c.id,
        userId: c.user?.id,
        name: c.name,
        categoryType: c.categoryType,
        parentId: c.parent?.id,
        icon: c.icon,
        color: c.color,
        isSystem: c.isSystem ?? false,
      }));

      setAccounts(mappedAccounts);
      setTransactions(mappedTransactions);
      setCategories(mappedCategories);
    } catch (err) {
      console.error('Failed to fetch financial data from MySQL API', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Compute Net Worth directly from live accounts
  const netWorth: NetWorthSummary = React.useMemo(() => {
    let cashAndBank = 0;
    let investments = 0;
    let creditCardDebt = 0;

    accounts.forEach((acc) => {
      if (!acc.isActive) return;
      if (acc.accountType === 'SAVINGS' || acc.accountType === 'CHECKING' || acc.accountType === 'CASH' || acc.accountType === 'WALLET') {
        cashAndBank += acc.currentBalance;
      } else if (acc.accountType === 'INVESTMENT') {
        investments += acc.currentBalance;
      } else if (acc.accountType === 'CREDIT_CARD') {
        creditCardDebt += acc.currentBalance;
      }
    });

    const totalAssets = cashAndBank + investments;
    const totalLiabilities = creditCardDebt;
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      cashAndBankTotal: cashAndBank,
      investmentsTotal: investments,
      creditCardDebtTotal: creditCardDebt,
    };
  }, [accounts]);

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId'>) => {
    await api.post('/transactions', {
      transactionType: txData.transactionType,
      amount: txData.amount,
      transactionDate: txData.transactionDate,
      sourceAccountId: txData.sourceAccountId,
      destinationAccountId: txData.destinationAccountId,
      categoryId: txData.categoryId,
      description: txData.description,
      payeeMerchant: txData.payeeMerchant,
    });

    // Re-fetch fresh ledger balances from MySQL
    await refreshData();
  };

  const addAccount = async (accData: Omit<Account, 'id' | 'userId'>) => {
    await api.post('/accounts', {
      name: accData.name,
      accountType: accData.accountType,
      currency: accData.currency || 'INR',
      currentBalance: accData.currentBalance,
      institutionName: accData.institutionName,
      accountNumberLast4: accData.accountNumberLast4,
      creditLimit: accData.creditLimit,
      billingCycleDay: accData.billingCycleDay,
      paymentDueDay: accData.paymentDueDay,
      investmentType: accData.investmentType,
      isActive: true,
    });

    // Re-fetch live accounts
    await refreshData();
  };

  return (
    <FinancialContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        netWorth,
        loading,
        addTransaction,
        addAccount,
        refreshData,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
