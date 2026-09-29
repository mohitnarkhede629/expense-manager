import React from 'react';
import { CreditCard, AlertCircle, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface CreditCardsViewProps {
  onOpenNewTx: () => void;
}

export const CreditCardsView: React.FC<CreditCardsViewProps> = ({ onOpenNewTx }) => {
  const { accounts } = useFinancial();
  const creditCards = accounts.filter((a) => a.accountType === 'CREDIT_CARD');

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Credit Cards & Utilization</h2>
        <p className="text-xs text-slate-500">
          Track billing cycles, due dates, outstanding dues, and credit health
        </p>
      </div>

      {creditCards.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          No credit cards added yet. Add one in the Accounts tab!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {creditCards.map((card) => {
            const limit = card.creditLimit || 100000;
            const outstanding = card.currentBalance;
            const available = Math.max(0, limit - outstanding);
            const utilizationPct = Math.min(100, Math.round((outstanding / limit) * 100));

            const isHighUtilization = utilizationPct > 30;

            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 space-y-5 relative overflow-hidden"
              >
                {/* Visual Card Strip */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-950 text-white shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                      {card.institutionName || 'Credit Card'}
                    </span>
                    <CreditCard className="w-6 h-6 text-indigo-200" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-wide text-white">{card.name}</div>
                    <div className="text-xs font-mono text-slate-400 mt-1">•••• •••• •••• {card.accountNumberLast4 || '4242'}</div>
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Total Credit Limit</div>
                      <div className="font-bold text-white">₹{limit.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Available Limit</div>
                      <div className="font-bold text-emerald-400">₹{available.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                    <span className="text-slate-600">Credit Utilization</span>
                    <span
                      className={`${
                        utilizationPct > 70
                          ? 'text-rose-600'
                          : utilizationPct > 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {utilizationPct}% {utilizationPct > 30 ? '(Keep under 30% for credit score)' : 'Healthy'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        utilizationPct > 70
                          ? 'bg-rose-500'
                          : utilizationPct > 30
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Statement & Due Date Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Statement Date</div>
                      <div className="font-semibold text-slate-800">
                        {card.billingCycleDay || 15}th of month
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-slate-400 text-[10px]">Payment Due Date</div>
                      <div className="font-semibold text-purple-700">
                        {card.paymentDueDay || 5}th of month
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs text-slate-400">Total Outstanding</span>
                    <div className="text-lg font-extrabold text-rose-600">
                      ₹{outstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    onClick={onOpenNewTx}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-200 transition-all"
                  >
                    Pay Bill <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
