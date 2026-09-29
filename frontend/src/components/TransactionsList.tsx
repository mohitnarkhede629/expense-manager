import React, { useState } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Banknote, 
  CreditCard, 
  TrendingUp, 
  ArrowLeftRight, 
  Search,
  Filter
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { TransactionType } from '../types';

export const TransactionsList: React.FC = () => {
  const { transactions, accounts, categories } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.payeeMerchant && tx.payeeMerchant.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterType === 'ALL' || tx.transactionType === filterType;

    return matchesSearch && matchesFilter;
  });

  const getAccountName = (accountId?: number) => {
    if (!accountId) return '';
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.name : '';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Transaction Activity</h2>
        <p className="text-xs text-slate-500">Real-time ledger entries across your bank accounts, credit cards, cash, and investments</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search merchant, description, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          {[
            { id: 'ALL', label: 'All' },
            { id: 'EXPENSE', label: 'Expenses' },
            { id: 'INCOME', label: 'Income' },
            { id: 'ATM_WITHDRAWAL', label: 'Cash Out' },
            { id: 'CREDIT_CARD_PAYMENT', label: 'CC Bill' },
            { id: 'INVESTMENT_DEPOSIT', label: 'Investments' },
          ].map((f) => (
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No transactions match your search or filter.</div>
        ) : (
          filteredTransactions.map((tx) => {
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
                      {tx.payeeMerchant || tx.description || cat?.name || tx.transactionType}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
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
  );
};
