import React, { useState } from 'react';
import { 
  Sparkles, 
  Landmark, 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  AlertCircle,
  HelpCircle,
  Coins
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { Account, AccountType } from '../types';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BankPreset {
  name: string;
  institution: string;
  defaultName: string;
}

interface CardPreset {
  name: string;
  institution: string;
  defaultName: string;
  defaultLimit: number;
}

interface InvestPreset {
  name: string;
  institution: string;
  type: 'MUTUAL_FUNDS' | 'STOCKS';
}

const BANK_PRESETS: BankPreset[] = [
  { name: 'HDFC Bank', institution: 'HDFC', defaultName: 'HDFC Salary Account' },
  { name: 'SBI', institution: 'State Bank of India', defaultName: 'SBI Savings Account' },
  { name: 'ICICI Bank', institution: 'ICICI', defaultName: 'ICICI Main Account' },
  { name: 'Axis Bank', institution: 'Axis Bank', defaultName: 'Axis Savings Account' },
  { name: 'Kotak', institution: 'Kotak Mahindra', defaultName: 'Kotak 811 Account' },
];

const CARD_PRESETS: CardPreset[] = [
  { name: 'Amazon Pay ICICI', institution: 'ICICI', defaultName: 'Amazon Pay ICICI Card', defaultLimit: 100000 },
  { name: 'HDFC Millennia', institution: 'HDFC', defaultName: 'HDFC Millennia Credit Card', defaultLimit: 150000 },
  { name: 'Flipkart Axis', institution: 'Axis Bank', defaultName: 'Flipkart Axis Bank Card', defaultLimit: 100000 },
  { name: 'SBI SimplyCLICK', institution: 'SBI Card', defaultName: 'SBI SimplyCLICK Card', defaultLimit: 75000 },
];

const INVEST_PRESETS: InvestPreset[] = [
  { name: 'Groww', institution: 'Groww', type: 'MUTUAL_FUNDS' },
  { name: 'Zerodha / Kite', institution: 'Zerodha', type: 'STOCKS' },
  { name: 'Upstox', institution: 'Upstox', type: 'STOCKS' },
  { name: 'Mutual Funds / EPF', institution: 'Direct Mutual Funds', type: 'MUTUAL_FUNDS' },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addAccountsBatch } = useFinancial();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 State - Primary Bank Account
  const [hasBank, setHasBank] = useState<boolean>(true);
  const [bankInstitution, setBankInstitution] = useState<string>('HDFC');
  const [bankName, setBankName] = useState<string>('HDFC Salary Account');
  const [bankBalance, setBankBalance] = useState<string>('25000');
  const [bankLast4, setBankLast4] = useState<string>('');

  // Step 3 State - Credit Card
  const [hasCard, setHasCard] = useState<boolean>(false);
  const [cardInstitution, setCardInstitution] = useState<string>('ICICI');
  const [cardName, setCardName] = useState<string>('Amazon Pay ICICI Card');
  const [cardLimit, setCardLimit] = useState<string>('100000');
  const [cardOutstanding, setCardOutstanding] = useState<string>('0');
  const [billingCycleDay, setBillingCycleDay] = useState<number>(15);
  const [paymentDueDay, setPaymentDueDay] = useState<number>(5);

  // Step 4 State - Cash & Investments
  const [hasCash, setHasCash] = useState<boolean>(true);
  const [cashBalance, setCashBalance] = useState<string>('2000');

  const [hasInvest, setHasInvest] = useState<boolean>(false);
  const [investInstitution, setInvestInstitution] = useState<string>('Groww');
  const [investName, setInvestName] = useState<string>('Groww Mutual Funds');
  const [investBalance, setInvestBalance] = useState<string>('50000');

  if (!isOpen) return null;

  const markDismissed = () => {
    if (user?.id) {
      localStorage.setItem(`dismissed_onboarding_${user.id}`, 'true');
    }
  };

  const handleSkipAll = () => {
    markDismissed();
    onClose();
  };

  const handleSelectBankPreset = (preset: BankPreset) => {
    setBankInstitution(preset.institution);
    setBankName(preset.defaultName);
  };

  const handleSelectCardPreset = (preset: CardPreset) => {
    setCardInstitution(preset.institution);
    setCardName(preset.defaultName);
    setCardLimit(preset.defaultLimit.toString());
  };

  const handleSelectInvestPreset = (preset: InvestPreset) => {
    setInvestInstitution(preset.institution);
    setInvestName(`${preset.institution} Portfolio`);
  };

  // Live computations
  const numBank = hasBank ? parseFloat(bankBalance) || 0 : 0;
  const numCash = hasCash ? parseFloat(cashBalance) || 0 : 0;
  const numInvest = hasInvest ? parseFloat(investBalance) || 0 : 0;
  const numCardOutstanding = hasCard ? parseFloat(cardOutstanding) || 0 : 0;

  const totalAssets = numBank + numCash + numInvest;
  const totalLiabilities = numCardOutstanding;
  const startingNetWorth = totalAssets - totalLiabilities;

  const handleFinishAndCreate = async () => {
    setIsSubmitting(true);
    setError(null);

    const accountsToCreate: Omit<Account, 'id' | 'userId'>[] = [];

    if (hasBank && bankName.trim()) {
      accountsToCreate.push({
        name: bankName.trim(),
        accountType: 'SAVINGS' as AccountType,
        institutionName: bankInstitution,
        currentBalance: parseFloat(bankBalance) || 0,
        accountNumberLast4: bankLast4.trim() ? bankLast4.trim().slice(-4) : undefined,
        currency: user?.baseCurrency || 'INR',
        isActive: true,
      });
    }

    if (hasCard && cardName.trim()) {
      accountsToCreate.push({
        name: cardName.trim(),
        accountType: 'CREDIT_CARD' as AccountType,
        institutionName: cardInstitution,
        creditLimit: parseFloat(cardLimit) || 0,
        currentBalance: parseFloat(cardOutstanding) || 0,
        billingCycleDay: Number(billingCycleDay),
        paymentDueDay: Number(paymentDueDay),
        currency: user?.baseCurrency || 'INR',
        isActive: true,
      });
    }

    if (hasCash) {
      accountsToCreate.push({
        name: 'Cash Wallet',
        accountType: 'CASH' as AccountType,
        institutionName: 'Physical Cash',
        currentBalance: parseFloat(cashBalance) || 0,
        currency: user?.baseCurrency || 'INR',
        isActive: true,
      });
    }

    if (hasInvest && investName.trim()) {
      accountsToCreate.push({
        name: investName.trim(),
        accountType: 'INVESTMENT' as AccountType,
        investmentType: 'MUTUAL_FUNDS',
        institutionName: investInstitution,
        currentBalance: parseFloat(investBalance) || 0,
        currency: user?.baseCurrency || 'INR',
        isActive: true,
      });
    }

    try {
      if (accountsToCreate.length > 0) {
        await addAccountsBatch(accountsToCreate);
      }
      markDismissed();
      setStep(5);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save starter accounts. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsLabel = [
    { num: 1, label: 'Welcome' },
    { num: 2, label: 'Bank' },
    { num: 3, label: 'Credit Card' },
    { num: 4, label: 'Cash & Invest' },
    { num: 5, label: 'Ready!' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Progress Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Personal Setup Wizard</span>
            </div>
            {step < 5 && (
              <button
                onClick={handleSkipAll}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
              >
                Skip setup
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between gap-2">
            {stepsLabel.map((s, idx) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-indigo-600'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 font-medium hidden sm:block ${
                      isCurrent
                        ? 'text-indigo-600 font-bold'
                        : isPast
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Welcome & Guidelines */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-3 border border-indigo-100/60">
                  👋 Welcome aboard
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome to Expense Manager{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Take 60 seconds to configure your real accounts. We never create fake filler accounts—your financial ledger starts accurate from day one.
                </p>
              </div>

              {/* 30-Sec Quick Guidelines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">1. Bank Accounts & UPI</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Your everyday checking and savings where salary and UPI money lives.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">2. Credit Cards</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Track billing cycles, credit limits, and outstanding card dues cleanly.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">3. Physical Cash & Wallets</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Track currency in your pocket and ATM cash withdrawals seamlessly.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">4. Investments & Wealth</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Track Groww, Zerodha, or mutual fund valuations towards your Net Worth.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-3 px-5 rounded-2xl font-bold text-sm shadow-md shadow-indigo-100 transition-all"
                >
                  <span>Let's Set Up Your Accounts (~1 min)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSkipAll}
                  className="py-3 px-4 rounded-2xl font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-sm transition-colors text-center"
                >
                  Skip & explore manually
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Primary Bank Account */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 2 of 4</span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Where do you receive your income or make UPI payments?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add your primary savings or salary bank account.
                </p>
              </div>

              {/* Quick Preset Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Popular Bank Presets (Tap to autofill):
                </label>
                <div className="flex flex-wrap gap-2">
                  {BANK_PRESETS.map((p) => {
                    const isSelected = bankInstitution === p.institution;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleSelectBankPreset(p)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setBankInstitution('Other Bank');
                      setBankName('Main Bank Account');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  >
                    Custom Bank
                  </button>
                </div>
              </div>

              <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Salary Account"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Starting Balance (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={bankBalance}
                      onChange={(e) => setBankBalance(e.target.value)}
                      placeholder="25000"
                      className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your real current balance so your ledger starts calibrated right away.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number Last 4 Digits <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={bankLast4}
                    onChange={(e) => setBankLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4821"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 py-2.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHasBank(false);
                      setStep(3);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 py-2.5 px-3 font-semibold"
                  >
                    Skip Bank for now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasBank(true);
                      setStep(3);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-indigo-100 transition-all"
                  >
                    <span>Next: Add Credit Card</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Credit Card */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 3 of 4</span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Do you use any Credit Cards?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Keep credit card debt separated from your bank balance for honest net worth calculations.
                </p>
              </div>

              {/* Yes / No Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasCard(true)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    hasCard
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className={`w-5 h-5 ${hasCard ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900">Yes, add a card</span>
                  </div>
                  {hasCard && <Check className="w-4 h-4 text-indigo-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setHasCard(false)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    !hasCard
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-5 h-5 ${!hasCard ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-900">I don't use cards</span>
                  </div>
                  {!hasCard && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              </div>

              {hasCard && (
                <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 animate-fadeIn">
                  {/* Preset Chips */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Popular Card Presets:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_PRESETS.map((p) => {
                        const isSelected = cardName === p.defaultName;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => handleSelectCardPreset(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Card Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. Amazon Pay ICICI Card"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Total Credit Limit (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={cardLimit}
                          onChange={(e) => setCardLimit(e.target.value)}
                          placeholder="100000"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Outstanding (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={cardOutstanding}
                          onChange={(e) => setCardOutstanding(e.target.value)}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Statement Cycle Day
                      </label>
                      <select
                        value={billingCycleDay}
                        onChange={(e) => setBillingCycleDay(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}th of month
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Bill Due Day
                      </label>
                      <select
                        value={paymentDueDay}
                        onChange={(e) => setPaymentDueDay(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}th of month
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 py-2.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-sm shadow-indigo-100 transition-all"
                >
                  <span>Next: Cash & Investments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Cash & Investments */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 4 of 4</span>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Physical cash & investment sources
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Track money in your physical wallet and long-term investments.
                </p>
              </div>

              {/* Section A: Cash in Wallet */}
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/80 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCash}
                    onChange={(e) => setHasCash(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Track Physical Cash in Wallet
                    </span>
                  </div>
                </label>

                {hasCash && (
                  <div className="pl-6.5 pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Cash in Hand Right Now (₹)
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={cashBalance}
                        onChange={(e) => setCashBalance(e.target.value)}
                        placeholder="2000"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Section B: Investments */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInvest}
                    onChange={(e) => setHasInvest(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Track an Investment Portfolio (Mutual Funds / Stocks)
                    </span>
                  </div>
                </label>

                {hasInvest && (
                  <div className="space-y-3 pl-6.5 pt-1 animate-fadeIn">
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                        Platform Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {INVEST_PRESETS.map((p) => {
                          const isSelected = investInstitution === p.institution;
                          return (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => handleSelectInvestPreset(p)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Account / Platform Name
                        </label>
                        <input
                          type="text"
                          value={investName}
                          onChange={(e) => setInvestName(e.target.value)}
                          placeholder="e.g. Groww Mutual Funds"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Current Valuation (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={investBalance}
                            onChange={(e) => setInvestBalance(e.target.value)}
                            placeholder="50000"
                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Net Worth Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Calculated Starting Net Worth
                  </div>
                  <div className="text-lg font-black text-emerald-400">
                    ₹{startingNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>Assets: ₹{totalAssets.toLocaleString('en-IN')}</div>
                  <div>Liabilities: ₹{totalLiabilities.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 py-2.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinishAndCreate}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white py-2.5 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Finish Setup & Launch 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success & Instant Dashboard Calibration */}
          {step === 5 && (
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  You're All Set! 🎉
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your customized financial accounts and starting balances have been synchronized cleanly.
                </p>
              </div>

              {/* Net Worth Hero Display */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-xl shadow-indigo-950/20 max-w-md mx-auto">
                <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">
                  Calibrated Starting Net Worth
                </div>
                <div className="text-3xl font-extrabold text-emerald-400">
                  ₹{startingNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-slate-300">
                  <span>Assets: ₹{totalAssets.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>Liabilities: ₹{totalLiabilities.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Pro-Tip Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left text-xs text-slate-700 flex items-start gap-3 max-w-md mx-auto">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-indigo-900">Pro-Tip:</strong> Whenever you buy groceries, order food, or pay bills, tap <strong className="text-slate-900">+ New Transaction</strong> on your dashboard to deduct directly from the selected account.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
