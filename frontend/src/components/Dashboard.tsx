import React from 'react';
import { 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  Banknote, 
  Landmark, 
  Wallet,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface DashboardProps {
  onOpenNewTx: () => void;
  setActiveTab: (tab: string) => void;
  onOpenWizard?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenNewTx, setActiveTab, onOpenWizard }) => {
  const { accounts, transactions, netWorth, categories } = useFinancial();

  // Calculate monthly stats from transactions
  const now = new Date();
  const currentMonthTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.transactionDate);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter((tx) => tx.transactionType === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter((tx) => tx.transactionType === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalInvestedThisMonth = currentMonthTransactions
    .filter((tx) => tx.transactionType === 'INVESTMENT_DEPOSIT')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const recentTransactions = transactions.slice(0, 5);

  const getAccountBadge = (accountId?: number) => {
    if (!accountId) return null;
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return null;

    let color = 'bg-slate-100 text-slate-700';
    let Icon = Landmark;
    if (acc.accountType === 'CREDIT_CARD') {
      color = 'bg-purple-50 text-purple-700 border border-purple-100';
      Icon = CreditCard;
    } else if (acc.accountType === 'CASH' || acc.accountType === 'WALLET') {
      color = 'bg-amber-50 text-amber-700 border border-amber-100';
      Icon = Banknote;
    } else if (acc.accountType === 'INVESTMENT') {
      color = 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      Icon = TrendingUp;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {acc.name}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Net Worth Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Total Net Worth
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              ₹{netWorth.netWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs sm:text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Total Assets: </span>
                <span className="font-semibold text-emerald-400">
                  ₹{netWorth.totalAssets.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-700 hidden sm:block" />
              <div>
                <span className="text-slate-400">Liabilities (Cards): </span>
                <span className="font-semibold text-rose-400">
                  ₹{netWorth.totalLiabilities.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Net Worth Asset Breakdown Chips */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
            <div className="p-2">
              <div className="text-[11px] text-slate-400">Bank & Cash</div>
              <div className="text-sm font-bold text-white mt-0.5">
                ₹{netWorth.cashAndBankTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2 border-x border-white/10">
              <div className="text-[11px] text-slate-400">Investments</div>
              <div className="text-sm font-bold text-indigo-300 mt-0.5">
                ₹{netWorth.investmentsTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2">
              <div className="text-[11px] text-slate-400">Card Due</div>
              <div className="text-sm font-bold text-rose-300 mt-0.5">
                ₹{netWorth.creditCardDebtTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Cashflow & Investment Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">This Month Income</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              +₹{totalIncome.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">This Month Expenses</span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              -₹{totalExpenses.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Investments Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Invested This Month</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              ₹{totalInvestedThisMonth.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Accounts Snapshot & Balances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Your Accounts & Wallets</h2>
          <button
            onClick={() => setActiveTab('accounts')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Manage Accounts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-gradient-to-r from-indigo-50/90 via-violet-50/70 to-slate-50 rounded-3xl p-6 sm:p-8 border border-indigo-100 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Get Started with Guided Setup</h3>
            <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
              Link your primary bank account, credit cards, physical cash, and investment portfolio in ~1 minute to calibrate your dashboard and live net worth.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 justify-center">
              {onOpenWizard && (
                <button
                  onClick={onOpenWizard}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Step-by-Step Setup</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('accounts')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                + Add Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc) => {
              const isCard = acc.accountType === 'CREDIT_CARD';
              const isCash = acc.accountType === 'CASH' || acc.accountType === 'WALLET';
              const isInvest = acc.accountType === 'INVESTMENT';

              return (
                <div
                  key={acc.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isCard
                            ? 'bg-purple-100 text-purple-600'
                            : isCash
                            ? 'bg-amber-100 text-amber-600'
                            : isInvest
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        {isCard ? (
                          <CreditCard className="w-4 h-4" />
                        ) : isCash ? (
                          <Banknote className="w-4 h-4" />
                        ) : isInvest ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <Landmark className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 leading-tight">{acc.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {acc.institutionName || acc.accountType.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">{isCard ? 'Outstanding Due' : 'Balance'}</span>
                    <span
                      className={`text-base font-bold ${
                        isCard ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      ₹{acc.currentBalance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isCard && acc.creditLimit && (
                    <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                      <span>Limit: ₹{acc.creditLimit.toLocaleString('en-IN')}</span>
                      <span className="text-indigo-600 font-medium">
                        {Math.round((acc.currentBalance / acc.creditLimit) * 100)}% Used
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Recent Ledger Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions recorded yet. Click "Record Transaction" to add your first entry.
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isExpense = tx.transactionType === 'EXPENSE';
            const isIncome = tx.transactionType === 'INCOME';
            const isATM = tx.transactionType === 'ATM_WITHDRAWAL';
            const isCCPay = tx.transactionType === 'CREDIT_CARD_PAYMENT';
            const isInvest = tx.transactionType === 'INVESTMENT_DEPOSIT';

            const cat = categories.find((c) => c.id === tx.categoryId);

            return (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isExpense
                        ? 'bg-rose-50 text-rose-600'
                        : isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : isATM
                        ? 'bg-amber-50 text-amber-600'
                        : isCCPay
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {isExpense && <ArrowDownRight className="w-5 h-5" />}
                    {isIncome && <ArrowUpRight className="w-5 h-5" />}
                    {isATM && <Banknote className="w-5 h-5" />}
                    {isCCPay && <CreditCard className="w-5 h-5" />}
                    {isInvest && <TrendingUp className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {tx.payeeMerchant || tx.description || cat?.name || tx.transactionType}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {getAccountBadge(tx.sourceAccountId || tx.destinationAccountId)}
                      {cat && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {cat.name}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        • {new Date(tx.transactionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      isExpense
                        ? 'text-rose-600'
                        : isIncome
                        ? 'text-emerald-600'
                        : 'text-slate-800'
                    }`}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}₹{tx.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    {tx.transactionType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};
