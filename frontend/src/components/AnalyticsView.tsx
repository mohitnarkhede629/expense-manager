import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useFinancial } from '../context/FinancialContext';
import { PieChart as PieIcon, BarChart2 } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories } = useFinancial();
  const [timeframe, setTimeframe] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Dynamically compute cash flow trends from actual logged-in user transactions
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeframe === 'MONTHLY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months: { [key: string]: { name: string; year: number; month: number; Income: number; Expense: number; Investment: number } } = {};

      // Initialize past 6 months up to current month
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months[key] = {
          name: monthNames[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth(),
          Income: 0,
          Expense: 0,
          Investment: 0,
        };
      }

      // Populate from transactions
      transactions.forEach((tx) => {
        const d = new Date(tx.transactionDate);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (months[key]) {
          if (tx.transactionType === 'INCOME') {
            months[key].Income += tx.amount;
          } else if (tx.transactionType === 'EXPENSE') {
            months[key].Expense += tx.amount;
          } else if (tx.transactionType === 'INVESTMENT_DEPOSIT') {
            months[key].Investment += tx.amount;
          }
        }
      });

      return Object.values(months);
    }

    if (timeframe === 'WEEKLY') {
      const weeks: { [key: string]: { name: string; Income: number; Expense: number; Investment: number } } = {
        '3': { name: '3 Wks Ago', Income: 0, Expense: 0, Investment: 0 },
        '2': { name: '2 Wks Ago', Income: 0, Expense: 0, Investment: 0 },
        '1': { name: 'Last Week', Income: 0, Expense: 0, Investment: 0 },
        '0': { name: 'This Week', Income: 0, Expense: 0, Investment: 0 },
      };

      const oneDay = 24 * 60 * 60 * 1000;
      transactions.forEach((tx) => {
        const d = new Date(tx.transactionDate);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / oneDay);
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks >= 0 && diffWeeks <= 3) {
          const key = String(diffWeeks);
          if (weeks[key]) {
            if (tx.transactionType === 'INCOME') weeks[key].Income += tx.amount;
            else if (tx.transactionType === 'EXPENSE') weeks[key].Expense += tx.amount;
            else if (tx.transactionType === 'INVESTMENT_DEPOSIT') weeks[key].Investment += tx.amount;
          }
        }
      });

      return [weeks['3'], weeks['2'], weeks['1'], weeks['0']];
    }

    // YEARLY
    const years: { [key: number]: { name: string; Income: number; Expense: number; Investment: number } } = {};
    for (let i = 2; i >= 0; i--) {
      const y = now.getFullYear() - i;
      years[y] = { name: String(y), Income: 0, Expense: 0, Investment: 0 };
    }

    transactions.forEach((tx) => {
      const y = new Date(tx.transactionDate).getFullYear();
      if (years[y]) {
        if (tx.transactionType === 'INCOME') years[y].Income += tx.amount;
        else if (tx.transactionType === 'EXPENSE') years[y].Expense += tx.amount;
        else if (tx.transactionType === 'INVESTMENT_DEPOSIT') years[y].Investment += tx.amount;
      }
    });

    return Object.values(years);
  }, [transactions, timeframe]);

  // Compute category spending distribution from user's transactions
  const { categoryPieData, totalExpensesAllTime } = useMemo(() => {
    const categorySpendingMap: { [catId: number]: number } = {};
    let totalExp = 0;

    transactions
      .filter((tx) => tx.transactionType === 'EXPENSE' && tx.categoryId)
      .forEach((tx) => {
        categorySpendingMap[tx.categoryId!] = (categorySpendingMap[tx.categoryId!] || 0) + tx.amount;
        totalExp += tx.amount;
      });

    const pieData = Object.entries(categorySpendingMap).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === Number(catId));
      return {
        name: cat ? cat.name : 'Other',
        value: amount,
        color: cat?.color || '#6366f1',
      };
    });

    return { categoryPieData: pieData, totalExpensesAllTime: totalExp };
  }, [transactions, categories]);

  // Compute top-level metrics dynamically from actual data
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthTxs = transactions.filter((tx) => {
      const d = new Date(tx.transactionDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthIncome = currentMonthTxs
      .filter((tx) => tx.transactionType === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthExpense = currentMonthTxs
      .filter((tx) => tx.transactionType === 'EXPENSE')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Savings & Investment Rate
    const savingsRate = monthIncome > 0
      ? Math.max(0, Math.round(((monthIncome - monthExpense) / monthIncome) * 1000) / 10)
      : 0;

    // Average daily spend in current month
    const dayOfMonth = Math.max(1, now.getDate());
    const avgDailySpend = Math.round(monthExpense / dayOfMonth);

    // Top spending category
    let topCategory = 'None';
    let topCategoryAmount = 0;
    if (categoryPieData.length > 0) {
      const sorted = [...categoryPieData].sort((a, b) => b.value - a.value);
      topCategory = sorted[0].name;
      topCategoryAmount = sorted[0].value;
    }

    return {
      savingsRate,
      hasIncome: monthIncome > 0,
      avgDailySpend,
      monthExpense,
      topCategory,
      topCategoryAmount,
      totalExpensesAllTime,
    };
  }, [transactions, categoryPieData, totalExpensesAllTime]);

  const hasAnyChartActivity = chartData.some((d) => d.Income > 0 || d.Expense > 0 || d.Investment > 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header & Horizon Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Financial Analytics</h2>
          <p className="text-xs text-slate-500">Track cashflow, category patterns, and wealth growth over time</p>
        </div>

        <div className="inline-flex p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto">
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeframe === t ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Savings & Investment Rate</span>
          <div className={`text-2xl font-extrabold mt-1 ${metrics.savingsRate >= 50 ? 'text-emerald-600' : 'text-slate-800'}`}>
            {metrics.hasIncome ? `${metrics.savingsRate}%` : '0.0%'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.hasIncome
              ? metrics.savingsRate >= 50
                ? 'Above recommended target (50%)'
                : 'Below recommended target (50%)'
              : 'No income recorded this month'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Average Daily Spend</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            ₹{metrics.avgDailySpend.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.monthExpense > 0
              ? `Based on ₹${metrics.monthExpense.toLocaleString('en-IN')} spend this month`
              : 'No expenses recorded this month'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Top Spending Category</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">
            {metrics.topCategory}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {metrics.topCategoryAmount > 0
              ? `₹${metrics.topCategoryAmount.toLocaleString('en-IN')} (${Math.round((metrics.topCategoryAmount / metrics.totalExpensesAllTime) * 100)}% of total expenses)`
              : 'No expense categories recorded'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Cash Flow Trends (₹)</h3>
            <span className="text-xs text-slate-400 capitalize">{timeframe.toLowerCase()} view</span>
          </div>

          {!hasAnyChartActivity ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl">
              <BarChart2 className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No cash flow activity</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Record your income, expenses, or investments to see your cash flow comparison.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Investment" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-xs font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Income</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /> Expense</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500" /> Investment</div>
          </div>
        </div>

        {/* Expense Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Expense Distribution by Category</h3>
            <span className="text-xs text-slate-400">All-time</span>
          </div>

          {categoryPieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl">
              <PieIcon className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No category expenses yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                When you record expenses with categories, your spending breakdown will be visualized here.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
