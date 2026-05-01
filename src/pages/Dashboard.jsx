import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import {
  Receipt, CalendarDays, TrendingUp,
  Clock, CheckCircle, PieChart, ArrowUpRight,
  Wallet, BarChart3, Banknote
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { dashboardApi } from '@/api/dashboardApi';
import { useAuthStore } from '@/store/authStore';
import { useCurrentBudget } from '@/hooks/useBudget';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
const CATEGORY_COLORS = { FOOD: '#10b981', OTHER: '#6366f1', TRIP: '#06b6d4' };

const formatCurrency = (val) => {
  if (val === undefined || val === null) return 'Rs.0';
  const n = Number(val);
  if (n >= 100000) return `Rs.${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs.${(n / 1000).toFixed(1)}K`;
  return `Rs.${n.toLocaleString('en-IN')}`;
};

const ChartCard = ({ title, children, icon: Icon, className = '', actions }) => (
  <motion.div variants={item} className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      {actions}
    </div>
    <div className="px-3 pb-5">{children}</div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-gray-800 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: p.color }} />
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const EmptyChart = ({ message = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center h-48 text-gray-400">
    <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
);

export const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [viewMode, setViewMode] = useState('me');
  const [trendMode, setTrendMode] = useState('monthly');

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', month, year, trendMode, viewMode],
    queryFn: () => dashboardApi.getStats({ month, year, scope: viewMode, trend_mode: trendMode }).then((r) => r.data.data),
  });

  const { data: budgetData, isLoading: isBudgetLoading } = useCurrentBudget();

  if (isLoading || isBudgetLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Dashboard">
        <div className="bg-white border border-[#e5e7eb] rounded-card p-6 text-sm text-red-600">
          Failed to load dashboard data.
        </div>
      </PageLayout>
    );
  }

  const kpis = data?.kpis || {};
  const trend = data?.monthlyTrend || [];
  const categories = data?.categoryBreakdown || [];
  const recent = data?.recentExpenses || [];
  const statusBreakdown = data?.statusBreakdown || [];
  const topSpenders = data?.topSpenders || [];
  const leaveData = data?.employeeLeaveBalances || [];
  const periodLabel = month ? months.find((m) => m.value === month)?.label : 'the full year';

  return (
    <PageLayout title="Dashboard">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Here is your {viewMode === 'all' ? 'all employees overview' : 'personal expense overview'} for {periodLabel} {year || ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="w-full sm:w-24 bg-white shrink-0">
                <option value="me">Me</option>
                <option value="all">All</option>
              </Select>
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full sm:w-36 bg-white shrink-0">
              <option value="">All Months</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-full sm:w-28 bg-white shrink-0">
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div variants={item}>
            {viewMode === 'all' ? (
              <StatCard
                label={month ? 'Month Budget Left' : 'Period Budget Left'}
                value={Math.round((budgetData?.monthly_budget || 0) - (kpis.thisMonthTotal || 0))}
                icon={TrendingUp}
                color={(budgetData?.monthly_budget || 0) - (kpis.thisMonthTotal || 0) < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
                prefix="Rs."
              />
            ) : (
              <StatCard
                label={month ? 'Selected Month' : 'Selected Period'}
                value={Math.round(kpis.thisMonthTotal || 0)}
                icon={TrendingUp}
                color="bg-emerald-50 text-emerald-600"
                prefix="Rs."
              />
            )}
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Unsettled"
              value={Math.round(kpis.unsettledTotal || 0)}
              icon={Clock}
              color="bg-amber-50 text-amber-600"
              prefix="Rs."
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label="Settled"
              value={Math.round(kpis.settledTotal || 0)}
              icon={CheckCircle}
              color="bg-green-50 text-green-600"
              prefix="Rs."
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard
              label={budgetData?.budget_set ? `Remaining Q${budgetData.quarter} Budget` : 'Remaining Budget'}
              value={Math.round(budgetData?.remaining || 0)}
              icon={Banknote}
              color={budgetData?.over_budget ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}
              prefix="Rs."
            />
          </motion.div>

        </motion.div>

        <div className="grid grid-cols-1 gap-5">
          <ChartCard
            title={trendMode === 'quarterly' ? 'Expense Trend' : 'Monthly Expense Trend'}
            icon={TrendingUp}
            actions={
              <div className="inline-flex rounded-lg border border-[#e5e7eb] overflow-hidden">
                <Button
                  type="button"
                  onClick={() => setTrendMode('monthly')}
                  className={`rounded-none border-0 px-3 py-1.5 text-xs ${trendMode === 'monthly' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  onClick={() => setTrendMode('quarterly')}
                  className={`rounded-none border-0 px-3 py-1.5 text-xs ${trendMode === 'quarterly' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Quarterly
                </Button>
              </div>
            }
          >
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                {trendMode === 'quarterly' ? (
                  <BarChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Total" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                ) : (
                  <AreaChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area type="monotone" dataKey="total" name="Total" stroke="#4f46e5" strokeWidth={2.5} fill="url(#colorTotal)" dot={{ r: 3, fill: '#4f46e5' }} activeDot={{ r: 5 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : <EmptyChart message="No expense data for the selected period" />}
          </ChartCard>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {statusBreakdown && statusBreakdown.length > 0 && (
            <ChartCard title="Settlement Status" icon={CheckCircle}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusBreakdown} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <ChartCard title="Recent Expenses" icon={Receipt}>
            {recent.length > 0 ? (
              <div className="space-y-1.5 px-2">
                {recent.map((exp, i) => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        exp.expense_type === 'FOOD' ? 'bg-emerald-50 text-emerald-600' :
                        exp.expense_type === 'TRIP' ? 'bg-cyan-50 text-cyan-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {exp.expense_type?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{exp.title}</p>
                        <p className="text-xs text-gray-400">
                          {exp.employee_name && `${exp.employee_name} · `}
                          {exp.expense_date ? format(new Date(exp.expense_date), 'dd MMM') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-gray-900">Rs.{Number(exp.amount).toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        exp.is_settled ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {exp.is_settled ? 'Settled' : 'Pending'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Receipt className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No recent expenses</p>
                <p className="text-xs mt-1">Expenses will appear here once added</p>
              </div>
            )}
          </ChartCard>
        </div>

        {viewMode === 'me' && topSpenders.length > 0 && (
          <ChartCard title="Top Spenders" icon={ArrowUpRight}>
            <div className="space-y-2 px-2">
              {topSpenders.map((spender, i) => {
                const maxTotal = topSpenders[0]?.total || 1;
                const pct = Math.round((spender.total / maxTotal) * 100);
                return (
                  <div key={spender.employeeId} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate block">{spender.name}</span>
                          {spender.department && <span className="text-[11px] text-gray-400">{spender.department}</span>}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 ml-3 shrink-0">
                          Rs.{Number(spender.total).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </motion.div>
    </PageLayout>
  );
};
