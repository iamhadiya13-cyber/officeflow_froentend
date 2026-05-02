import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBudgetUsage, useQuarterlyBudgets, useCreateBudget } from '@/hooks/useBudget';
import { useAuthStore } from '@/store/authStore';
import { Settings, UtensilsCrossed, Package, Plane, AlertTriangle, TrendingUp } from 'lucide-react';

const typeConfig = {
  FOOD: { icon: UtensilsCrossed, label: 'Food', chipClass: 'bg-green-50 text-green-800', color: 'green' },
  OTHER: { icon: Package, label: 'Other', chipClass: 'bg-indigo-50 text-indigo-800', color: 'indigo' },
  TRIP: { icon: Plane, label: 'Trip', chipClass: 'bg-cyan-50 text-cyan-800', color: 'cyan' },
};

const getBarColor = (pct) => {
  if (pct >= 100) return 'bg-red-500';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-green-500';
};

const getTextColor = (pct) => {
  if (pct >= 100) return 'text-red-600';
  if (pct >= 75) return 'text-amber-600';
  return 'text-green-600';
};

const getStatusBadge = (b) => {
  if (!b.budget_set) return { text: 'Not Set', cls: 'bg-gray-100 text-gray-500' };
  if (b.percentage >= 100 || b.over_budget) return { text: 'Over Budget', cls: 'bg-red-50 text-red-800' };
  if (b.percentage >= 75) return { text: 'Warning', cls: 'bg-amber-50 text-amber-800' };
  return { text: 'On Track', cls: 'bg-green-50 text-green-800' };
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const UsageCard = ({ b }) => {
  const cfg = typeConfig[b.expense_type] || typeConfig.OTHER;
  const Icon = cfg.icon;

  return (
    <motion.div variants={item} className="bg-white rounded-card border border-[#e5e7eb] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.chipClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`px-2.5 py-0.5 rounded-badge text-xs font-medium ${cfg.chipClass}`}>{cfg.label}</span>
        </div>
        {b.over_budget && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>

      <div>
        <p className="text-2xl font-semibold text-gray-900">Rs.{fmt(b.used)}</p>
        <p className="text-sm text-gray-500">Used this quarter</p>
      </div>

      <div className="text-xs text-gray-400 mt-auto">
        Q{b.quarter || Math.ceil((new Date().getMonth() + 1) / 3)} {b.year || new Date().getFullYear()}
      </div>
    </motion.div>
  );
};

const TotalBudgetCard = ({ totalBudget, totalUsed, quarter, year, budgetSet }) => {
  const remaining = totalBudget - totalUsed;
  const pct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;

  return (
    <motion.div variants={item} className="bg-white rounded-card border border-[#e5e7eb] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Quarterly Budget</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">Rs.{fmt(totalBudget)}</p>
        </div>
        {remaining < 0 && <AlertTriangle className="w-5 h-5 text-red-500" />}
      </div>

      {!budgetSet && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          No budget set. Click Set Budget to configure.
        </div>
      )}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-sm">
        <span className={getTextColor(pct)}>Rs.{fmt(totalUsed)} used ({pct}%)</span>
        {remaining < 0 ? (
          <span className="text-red-600 font-medium">Rs.{fmt(Math.abs(remaining))} over budget</span>
        ) : (
          <span className="text-green-600">Rs.{fmt(remaining)} remaining ({Math.max(100 - pct, 0)}%)</span>
        )}
      </div>

      <div className="bg-gray-100 rounded-full h-2.5 w-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor(pct)}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="text-xs text-gray-400">
        Q{quarter} {year}
      </div>
    </motion.div>
  );
};

export const Budget = () => {
  const user = useAuthStore(s => s.user);
  const { data: usage, isLoading } = useBudgetUsage();
  const { data: allBudgets } = useQuarterlyBudgets();
  const createMutation = useCreateBudget();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [form, setForm] = useState({
    expense_type: 'FOOD',
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    total_budget: '',
  });

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentYear = new Date().getFullYear();

  const openSetBudget = (prefill = null) => {
    if (prefill) {
      setForm({
        expense_type: prefill.expense_type,
        year: prefill.year,
        quarter: prefill.quarter,
        total_budget: prefill.total_budget || '',
      });
      setEditBudget(prefill);
    } else {
      setForm({ expense_type: 'FOOD', year: currentYear, quarter: currentQuarter, total_budget: '' });
      setEditBudget(null);
    }
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      monthly_amount: parseFloat(form.total_budget) / 3,
    });
    setShowForm(false);
    setForm(f => ({ ...f, total_budget: '' }));
    setEditBudget(null);
  };

  const quarterLabel = (q) => {
    const labels = { 1: 'Q1 (Jan-Mar)', 2: 'Q2 (Apr-Jun)', 3: 'Q3 (Jul-Sep)', 4: 'Q4 (Oct-Dec)' };
    return labels[q] || `Q${q}`;
  };

  if (isLoading) {
    return (
      <PageLayout title="Budget">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
        <Skeleton className="h-48" />
      </PageLayout>
    );
  }

  const budgets = usage || [];
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.total_budget || 0), 0);
  const totalUsed = budgets.reduce((sum, b) => sum + Number(b.used || 0), 0);
  const budgetSet = budgets.some((b) => b.budget_set);

  return (
    <PageLayout title="Budget">
      <div className="space-y-8">

        {/* Section 1 — Current Quarter Overview */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Q{currentQuarter} {currentYear} Budget Overview
            </h2>
            {user?.role === 'SUPER_ADMIN' && (
              <Button onClick={() => openSetBudget()} className="w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-1.5" /> Set Budget
              </Button>
            )}
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
          >
            {budgets.length > 0 ? (
              <>
                <TotalBudgetCard
                  totalBudget={totalBudget}
                  totalUsed={totalUsed}
                  quarter={currentQuarter}
                  year={currentYear}
                  budgetSet={budgetSet}
                />
                {budgets.map((b) => <UsageCard key={b.expense_type} b={b} />)}
              </>
            ) : (
              <div className="md:col-span-3 bg-white rounded-card border border-[#e5e7eb] p-8 text-center text-gray-500 shadow-sm">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">No Budget Data</p>
                <p className="text-sm">Budget data will appear here once configured.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Section 2 — Usage Breakdown Table */}
        {budgets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Expense Breakdown This Quarter</h3>
            <div className="bg-white rounded-card border border-[#e5e7eb] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-[#f8f8f8] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Used</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">% of Total Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) => {
                      const cfg = typeConfig[b.expense_type] || typeConfig.OTHER;
                      const pct = totalBudget > 0 ? Math.round((Number(b.used || 0) / totalBudget) * 100) : 0;
                      return (
                        <tr key={b.expense_type} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]">
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2.5 py-0.5 rounded-badge text-xs font-medium ${cfg.chipClass}`}>{cfg.label}</span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${getTextColor(pct)}`}>Rs.{fmt(b.used)}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getTextColor(pct)}`}>{pct}%</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${getBarColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section 3 — Historical Budgets */}
        {allBudgets && allBudgets.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">All Quarters</h3>
            <div className="bg-white rounded-card border border-[#e5e7eb] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-[#f8f8f8] border-b border-[#e5e7eb]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Quarter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</th>
                      {user?.role === 'SUPER_ADMIN' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {allBudgets.map((b) => {
                      const cfg = typeConfig[b.expense_type] || typeConfig.OTHER;
                      return (
                        <tr key={`${b.year}-${b.quarter}-${b.expense_type}`} className="border-b border-[#e5e7eb] hover:bg-[#f3f4f6]">
                          <td className="px-4 py-3 text-sm font-medium">{quarterLabel(b.quarter)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{b.year}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2.5 py-0.5 rounded-badge text-xs font-medium ${cfg.chipClass}`}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">Rs.{fmt(b.total_budget)}</td>
                          {user?.role === 'SUPER_ADMIN' && (
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => openSetBudget(b)}
                                className="text-primary hover:text-primary-hover font-medium text-xs"
                              >
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Set Budget Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditBudget(null); }} title={editBudget ? 'Edit Budget' : 'Set Budget'}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
            Setting this will update the company-wide total budget. Food and Other are tracked as usage categories under the same total.
          </div>
          <Input label="Quarterly Budget Amount (Rs.)" type="number" value={form.total_budget} onChange={(e) => setForm(f => ({ ...f, total_budget: e.target.value }))} required />

          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditBudget(null); }} className="w-full md:w-auto">Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full md:w-auto">Save</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};
