import React, { useState } from 'react';
import { Landmark, CreditCard, Banknote, TrendingUp, Plus, ShieldCheck } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { AccountType, InvestmentType } from '../types';

export const AccountsList: React.FC = () => {
  const { accounts, addAccount, netWorth } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New account form state
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('SAVINGS');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [last4, setLast4] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingCycleDay, setBillingCycleDay] = useState('15');
  const [paymentDueDay, setPaymentDueDay] = useState('5');
  const [investmentType, setInvestmentType] = useState<InvestmentType>('MUTUAL_FUNDS');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBalance = parseFloat(balance) || 0;
    const parsedLimit = creditLimit ? parseFloat(creditLimit) : undefined;

    addAccount({
      name,
      accountType,
      currency: 'INR',
      currentBalance: parsedBalance,
      institutionName: institution || undefined,
      accountNumberLast4: last4 || undefined,
      creditLimit: accountType === 'CREDIT_CARD' ? parsedLimit : undefined,
      billingCycleDay: accountType === 'CREDIT_CARD' ? parseInt(billingCycleDay) : undefined,
      paymentDueDay: accountType === 'CREDIT_CARD' ? parseInt(paymentDueDay) : undefined,
      investmentType: accountType === 'INVESTMENT' ? investmentType : undefined,
      isActive: true,
    });

    setIsModalOpen(false);
    setName('');
    setInstitution('');
    setBalance('');
    setLast4('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Accounts & Wallets</h2>
          <p className="text-xs text-slate-500">Manage your bank accounts, credit cards, cash, and investments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Empty State */}
      {accounts.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
          <Landmark className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Accounts Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any accounts or wallets set up. Create your bank account, credit card, or cash wallet to begin tracking your finances.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Your First Account
          </button>
        </div>
      )}

      {/* Account Categories */}
      {(['SAVINGS', 'CREDIT_CARD', 'CASH', 'INVESTMENT'] as AccountType[]).map((type) => {
        const filtered = accounts.filter((a) => a.accountType === type || (type === 'CASH' && a.accountType === 'WALLET'));
        if (filtered.length === 0) return null;

        const title =
          type === 'SAVINGS'
            ? 'Bank Accounts'
            : type === 'CREDIT_CARD'
            ? 'Credit Cards'
            : type === 'CASH'
            ? 'Cash & Wallets'
            : 'Investments & Wealth';

        return (
          <div key={type} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((acc) => {
                const isCard = acc.accountType === 'CREDIT_CARD';
                const isCash = acc.accountType === 'CASH' || acc.accountType === 'WALLET';
                const isInvest = acc.accountType === 'INVESTMENT';

                return (
                  <div
                    key={acc.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
                            <CreditCard className="w-5 h-5" />
                          ) : isCash ? (
                            <Banknote className="w-5 h-5" />
                          ) : isInvest ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <Landmark className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{acc.name}</div>
                          <div className="text-xs text-slate-400">
                            {acc.institutionName} {acc.accountNumberLast4 ? `(••${acc.accountNumberLast4})` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">
                        {isCard ? 'Outstanding Due' : isInvest ? 'Current Value' : 'Available Balance'}
                      </span>
                      <span className={`text-lg font-extrabold ${isCard ? 'text-rose-600' : 'text-slate-900'}`}>
                        ₹{acc.currentBalance.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {isCard && acc.creditLimit && (
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                        <span>Limit: ₹{acc.creditLimit.toLocaleString('en-IN')}</span>
                        <span className="font-semibold text-purple-600">
                          Due Date: {acc.paymentDueDay}th
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add New Account</h3>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, ICICI Card, Pocket Cash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="SAVINGS">Bank Savings</option>
                    <option value="CHECKING">Bank Current / Checking</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CASH">Physical Cash</option>
                    <option value="INVESTMENT">Investment Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    {accountType === 'CREDIT_CARD' ? 'Current Outstanding (₹)' : 'Initial Balance (₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank / Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, Zerodha, Physical Wallet"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              {accountType === 'CREDIT_CARD' && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">Total Limit</label>
                    <input
                      type="number"
                      placeholder="150000"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="w-full p-2 rounded-lg border border-purple-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">Cycle Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={billingCycleDay}
                      onChange={(e) => setBillingCycleDay(e.target.value)}
                      className="w-full p-2 rounded-lg border border-purple-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">Due Day</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                      className="w-full p-2 rounded-lg border border-purple-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
