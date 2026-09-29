import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, Lock, Mail, User, Wallet, CreditCard, Banknote, TrendingUp } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center text-white shadow-xl shadow-indigo-500/30 text-2xl font-black mb-3">
            ₹
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Expense Manager</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Multi-Account Banking, Credit Cards & Net Worth
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-900/60 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegister ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegister ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Mohit Narkhede"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="mohit@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Get Started' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {isRegister && (
            <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-700/50 text-[11px] text-slate-400">
              💡 Registering automatically sets up your starter <strong>Bank Account</strong> and <strong>Physical Cash Wallet</strong>.
            </div>
          )}
        </div>

        {/* Feature Highlights Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
            <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Multi-Account
          </span>
          <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Credit Cards
          </span>
          <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
            <Banknote className="w-3.5 h-3.5 text-amber-400" /> Cash Wallet
          </span>
          <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/40">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Investments
          </span>
        </div>
      </div>
    </div>
  );
};
