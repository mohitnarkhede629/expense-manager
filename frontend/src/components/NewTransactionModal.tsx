import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Landmark, 
  CreditCard, 
  Banknote, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { TransactionType } from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  const { accounts, categories, addTransaction } = useFinancial();

  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [sourceAccountId, setSourceAccountId] = useState<number | undefined>(undefined);
  const [destinationAccountId, setDestinationAccountId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [payee, setPayee] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getSourceAccounts = () => {
    if (txType === 'ATM_WITHDRAWAL') {
      return accounts.filter((a) => a.accountType === 'SAVINGS' || a.accountType === 'CHECKING');
    }
    if (txType === 'CREDIT_CARD_PAYMENT' || txType === 'INVESTMENT_DEPOSIT') {
      return accounts.filter((a) => a.accountType === 'SAVINGS' || a.accountType === 'CHECKING');
    }
    return accounts;
  };

  const getDestinationAccounts = (currentSourceId?: number) => {
    if (txType === 'ATM_WITHDRAWAL') {
      return accounts.filter((a) => a.accountType === 'CASH' || a.accountType === 'WALLET');
    }
    if (txType === 'CREDIT_CARD_PAYMENT') {
      return accounts.filter((a) => a.accountType === 'CREDIT_CARD');
    }
    if (txType === 'INVESTMENT_DEPOSIT') {
      return accounts.filter((a) => a.accountType === 'INVESTMENT');
    }
    const srcId = currentSourceId ?? sourceAccountId;
    return accounts.filter((a) => a.id !== srcId);
  };

  // Synchronize defaults whenever modal opens or txType / accounts change
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    const validSources = getSourceAccounts();
    const currentSourceValid = validSources.some((a) => a.id === sourceAccountId);
    const newSourceId = currentSourceValid ? sourceAccountId : validSources[0]?.id;
    setSourceAccountId(newSourceId);

    const validDests = getDestinationAccounts(newSourceId);
    const currentDestValid = validDests.some((a) => a.id === destinationAccountId);
    setDestinationAccountId(currentDestValid ? destinationAccountId : validDests[0]?.id);

    const validCats = categories.filter(
      (c) => c.categoryType === (txType === 'INCOME' ? 'INCOME' : 'EXPENSE')
    );
    const currentCatValid = validCats.some((c) => c.id === categoryId);
    setCategoryId(currentCatValid ? categoryId : validCats[0]?.id);
  }, [isOpen, txType, accounts, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (txType === 'INCOME') {
      if (!sourceAccountId) {
        setError('Please select a destination account to deposit income into.');
        return;
      }
    } else if (txType === 'EXPENSE') {
      if (!sourceAccountId) {
        setError('Please select a source account to pay from.');
        return;
      }
    } else {
      // Transfer, ATM, CC Bill, Investment
      if (!sourceAccountId) {
        setError('Please select a source account.');
        return;
      }
      if (!destinationAccountId) {
        setError('Please select a destination account.');
        return;
      }
      if (sourceAccountId === destinationAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await addTransaction({
        transactionType: txType,
        amount: parsedAmount,
        transactionDate: new Date(txDate).toISOString(),
        sourceAccountId: txType === 'INCOME' ? undefined : sourceAccountId,
        destinationAccountId:
          txType === 'INCOME'
            ? sourceAccountId // In income UI, sourceAccountId selector is the deposit target
            : txType === 'EXPENSE'
            ? undefined
            : destinationAccountId,
        categoryId: (txType === 'EXPENSE' || txType === 'INCOME') ? categoryId : undefined,
        description: description.trim() || undefined,
        payeeMerchant: payee.trim() || undefined,
        status: 'CLEARED',
      });

      onClose();
      // Reset form
      setAmount('');
      setDescription('');
      setPayee('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record transaction. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNoAccounts = accounts.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Record Transaction</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasNoAccounts ? (
          <div className="p-8 text-center space-y-3">
            <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Accounts Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You must have at least one bank account or cash wallet before you can record transactions.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
            >
              Close & Go to Accounts Tab
            </button>
          </div>
        ) : (
          <>
            {/* Transaction Type Buttons */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/30 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 min-w-max">
                {[
                  { type: 'EXPENSE' as TransactionType, label: 'Expense', icon: ArrowDownRight, color: 'text-red-600' },
                  { type: 'INCOME' as TransactionType, label: 'Income', icon: ArrowUpRight, color: 'text-emerald-600' },
                  { type: 'ATM_WITHDRAWAL' as TransactionType, label: 'ATM Cash Out', icon: Banknote, color: 'text-amber-600' },
                  { type: 'CREDIT_CARD_PAYMENT' as TransactionType, label: 'Pay CC Bill', icon: CreditCard, color: 'text-purple-600' },
                  { type: 'INVESTMENT_DEPOSIT' as TransactionType, label: 'Investment SIP', icon: TrendingUp, color: 'text-indigo-600' },
                  { type: 'TRANSFER' as TransactionType, label: 'Transfer', icon: ArrowLeftRight, color: 'text-blue-600' },
                ].map((btn) => {
                  const Icon = btn.icon;
                  const isSelected = txType === btn.type;
                  return (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setTxType(btn.type)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-white shadow-sm ring-1 ring-slate-200 text-slate-900'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${btn.color}`} />
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Amount (₹)</label>
                <div className="relative rounded-xl shadow-sm">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-semibold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Account Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {txType === 'INCOME' ? 'Deposit Into Account' : 'Paid From Account'}
                  </label>
                  <select
                    value={sourceAccountId ?? ''}
                    onChange={(e) => setSourceAccountId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {getSourceAccounts().map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.accountType}) — ₹{acc.currentBalance.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Account (For Transfers, ATM, CC Bill, Investment) */}
                {txType !== 'EXPENSE' && txType !== 'INCOME' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Destination Account</label>
                    <select
                      value={destinationAccountId ?? ''}
                      onChange={(e) => setDestinationAccountId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select destination account</option>
                      {getDestinationAccounts().map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category Selection (For Expense & Income) */}
                {(txType === 'EXPENSE' || txType === 'INCOME') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                    <select
                      value={categoryId ?? ''}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories
                        .filter((c) => c.categoryType === (txType === 'INCOME' ? 'INCOME' : 'EXPENSE'))
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Payee / Merchant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payee / Merchant (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Amazon, HDFC ATM"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend dinner with friends"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Ledger Insight Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                {txType === 'ATM_WITHDRAWAL' && (
                  <span>💡 <strong>Cash Out</strong>: Moves money from your Bank into your Cash Wallet without double-counting expenses.</span>
                )}
                {txType === 'CREDIT_CARD_PAYMENT' && (
                  <span>💡 <strong>CC Bill Pay</strong>: Clears your card debt from your bank account without double-counting expenses.</span>
                )}
                {txType === 'INVESTMENT_DEPOSIT' && (
                  <span>💡 <strong>Investment SIP</strong>: Reallocates bank cash into your investment portfolio. Net worth is preserved.</span>
                )}
                {txType === 'EXPENSE' && (
                  <span>💡 <strong>Expense</strong>: Deducted directly from the selected account and tracked in analytics.</span>
                )}
                {txType === 'INCOME' && (
                  <span>💡 <strong>Income</strong>: Increases your liquid cash and net worth.</span>
                )}
                {txType === 'TRANSFER' && (
                  <span>💡 <strong>Transfer</strong>: Moves funds between two accounts without altering total net worth.</span>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
