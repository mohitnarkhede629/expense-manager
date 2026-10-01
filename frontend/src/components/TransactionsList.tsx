import React, { useState, useMemo } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  ArrowLeftRight, 
  Search, 
  Filter,
  Plus
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface TransactionsListProps {
  onOpenNewTx?: () => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ onOpenNewTx }) => {
  const { transactions, accounts, categories } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return transactions.filter((tx) => {
      // 1. Transaction Type filter
      const matchesFilter =
        filterType === 'ALL' ||
        tx.transactionType === filterType ||
        (filterType === 'INVESTMENT_DEPOSIT' && tx.transactionType === 'INVESTMENT_WITHDRAWAL');

      if (!matchesFilter) return false;

      // 2. Search query filter: if search box is empty, include all transactions
      if (!query) return true;

      const desc = tx.description?.toLowerCase() || '';
      const payee = tx.payeeMerchant?.toLowerCase() || '';
      const cat = categories.find((c) => c.id === tx.categoryId)?.name.toLowerCase() || '';
      const srcAcc = accounts.find((a) => a.id === tx.sourceAccountId)?.name.toLowerCase() || '';
      const dstAcc = accounts.find((a) => a.id === tx.destinationAccountId)?.name.toLowerCase() || '';
      const typeStr = tx.transactionType.toLowerCase().replace(/_/g, ' ');
      const amountStr = tx.amount.toString();

      return (
        desc.includes(query) ||
        payee.includes(query) ||
        cat.includes(query) ||
        srcAcc.includes(query) ||
        dstAcc.includes(query) ||
        typeStr.includes(query) ||
        amountStr.includes(query)
      );
    });
  }, [transactions, searchTerm, filterType, categories, accounts]);

  const getAccountName = (accountId?: number) => {
    if (!accountId) return '';
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.name : '';
  };

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'EXPENSE', label: 'Expenses' },
    { id: 'INCOME', label: 'Income' },
    { id: 'TRANSFER', label: 'Transfers' },
    { id: 'ATM_WITHDRAWAL', label: 'Cash Out' },
    { id: 'CREDIT_CARD_PAYMENT', label: 'CC Bill' },
    { id: 'INVESTMENT_DEPOSIT', label: 'Investments' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Transaction Activity</h2>
          <p className="text-xs text-slate-500">Real-time ledger entries across your bank accounts, credit cards, cash, and investments</p>
        </div>
        {onOpenNewTx && (
          <button
            onClick={onOpenNewTx}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchant, notes, category, account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
          {filterOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Feed */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Transactions Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Record your first income, expense, transfer, or bill payment to start tracking your financial activity.
          </p>
          {onOpenNewTx && (
            <button
              onClick={onOpenNewTx}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-sm text-slate-500 font-medium">No transactions match your search or filter.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('ALL');
            }}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Reset filters & search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.transactionType === 'EXPENSE';
            const isIncome = tx.transactionType === 'INCOME';
            const isATM = tx.transactionType === 'ATM_WITHDRAWAL';
            const isCCPay = tx.transactionType === 'CREDIT_CARD_PAYMENT';
            const isInvest = tx.transactionType === 'INVESTMENT_DEPOSIT' || tx.transactionType === 'INVESTMENT_WITHDRAWAL';

            const cat = categories.find((c) => c.id === tx.categoryId);
            const title = tx.payeeMerchant || tx.description || cat?.name || tx.transactionType.replace(/_/g, ' ');

            return (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isExpense
                        ? 'bg-rose-50 text-rose-600'
                        : isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : isATM
                        ? 'bg-amber-50 text-amber-600'
                        : isCCPay
                        ? 'bg-purple-50 text-purple-600'
                        : isInvest
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isExpense && <ArrowDownRight className="w-5 h-5" />}
                    {isIncome && <ArrowUpRight className="w-5 h-5" />}
                    {isATM && <Banknote className="w-5 h-5" />}
                    {isCCPay && <CreditCard className="w-5 h-5" />}
                    {isInvest && <TrendingUp className="w-5 h-5" />}
                    {tx.transactionType === 'TRANSFER' && <ArrowLeftRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {title}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      {tx.payeeMerchant && tx.description && (
                        <span className="text-slate-600 font-normal">
                          {tx.description} •
                        </span>
                      )}
                      {tx.sourceAccountId && <span>{getAccountName(tx.sourceAccountId)}</span>}
                      {tx.destinationAccountId && (
                        <span>
                          {tx.sourceAccountId ? '→ ' : ''}
                          {getAccountName(tx.destinationAccountId)}
                        </span>
                      )}
                      {cat && <span>• {cat.name}</span>}
                      <span>• {new Date(tx.transactionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right pl-3 shrink-0">
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
          })}
        </div>
      )}
    </div>
  );
};
