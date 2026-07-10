import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, LineChart, Line, AreaChart, Area } from 'recharts';
import { BarChart3, PieChartIcon, LineChartIcon, Landmark } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { incomes, expenses, budgets, goals } = useData();
  const { formatCurrency } = useAppTheme();

  const [timeframe, setTimeframe] = useState<'6months' | '12months'>('6months');

  const today = new Date();
  const currentPeriod = today.toISOString().substring(0, 7);

  // Colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b', '#06b6d4', '#84cc16', '#a855f7'];

  // Helper: Get Last N Months
  const getLastNMonths = (n: number) => {
    const list = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push(d.toISOString().substring(0, 7));
    }
    return list;
  };

  const selectedMonths = getLastNMonths(timeframe === '6months' ? 6 : 12);

  // 1. Income vs Expense & Cash Flow
  const cashFlowData = selectedMonths.map(month => {
    const monthName = new Date(month + '-15').toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    const inc = incomes.filter(i => i.date.startsWith(month)).reduce((sum, i) => sum + i.amount, 0);
    const exp = expenses.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0);
    return {
      name: monthName,
      Income: inc,
      Expense: exp,
      Balance: inc - exp
    };
  });

  // 2. Expense by Category (Current Month)
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentPeriod));
  const categorySpendingMap: Record<string, number> = {};
  currentMonthExpenses.forEach(e => {
    categorySpendingMap[e.category] = (categorySpendingMap[e.category] || 0) + e.amount;
  });

  const categoryPieData = Object.entries(categorySpendingMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // 3. Budget vs Spending (Current Month)
  const currentBudgets = budgets.filter(b => b.period === currentPeriod);
  const budgetVsSpendData = currentBudgets.map(b => {
    let spent = 0;
    const label = b.type === 'monthly' ? 'Total Monthly' : `${b.category}`;
    if (b.type === 'monthly') {
      spent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    } else {
      spent = currentMonthExpenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
    }
    return {
      name: label,
      Limit: b.limitAmount,
      Spent: spent
    };
  });

  // 4. Weekly Spending (Current Month)
  // Divide month into 4 weeks: 1-7, 8-14, 15-21, 22+
  const getWeeklyData = () => {
    const weeklySums = [0, 0, 0, 0];
    currentMonthExpenses.forEach(e => {
      const day = new Date(e.date).getDate();
      if (day <= 7) weeklySums[0] += e.amount;
      else if (day <= 14) weeklySums[1] += e.amount;
      else if (day <= 21) weeklySums[2] += e.amount;
      else weeklySums[3] += e.amount;
    });
    return [
      { name: 'Week 1 (1-7)', Spending: weeklySums[0] },
      { name: 'Week 2 (8-14)', Spending: weeklySums[1] },
      { name: 'Week 3 (15-21)', Spending: weeklySums[2] },
      { name: 'Week 4 (22+)', Spending: weeklySums[3] }
    ];
  };

  const weeklySpendingData = getWeeklyData();

  // 5. Savings Progress
  const savingsData = goals.map(g => ({
    name: g.name,
    Saved: g.savedAmount,
    Target: g.targetAmount
  }));

  const customTooltipFormatter = (value: any) => [formatCurrency(value), ''];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep-dive visual representations of your budgets, savings, and net margins.</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-350 dark:bg-slate-900 cursor-pointer"
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      {/* Row 1: Cash Flow & Category Spread */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-500" />
            Income vs Expense Cash Flow
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip formatter={customTooltipFormatter} />
                <Legend />
                <Area type="monotone" dataKey="Income" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="Expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Category (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-500" />
            Spending by Category ({currentPeriod})
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-slate-400 text-sm">No expenses logged for this month.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={customTooltipFormatter} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Budget vs Spending & Weekly breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Spending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Budget vs Spending ({currentPeriod})
          </h3>
          <div className="h-80 w-full">
            {budgetVsSpendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No active budgets set for this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsSpendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip formatter={customTooltipFormatter} />
                  <Legend />
                  <Bar dataKey="Limit" fill="#64748b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Spending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-amber-500" />
            Weekly Spending breakdown
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySpendingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip formatter={customTooltipFormatter} />
                <Bar dataKey="Spending" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                  {weeklySpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Savings Progress Line Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-emerald-500" />
          Savings Goals allocations
        </h3>
        <div className="h-80 w-full">
          {savingsData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No savings goals configured.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-850" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip formatter={customTooltipFormatter} />
                <Legend />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
