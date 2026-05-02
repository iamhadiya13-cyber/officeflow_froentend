import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge, TypeChip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useExpenses, useCreateExpense, useUpdateExpense, useArchiveExpense, useSettleExpense, useExpenseYears, useQuarterSnapshots } from '@/hooks/useExpenses';
import { useAuthStore } from '@/store/authStore';
import { Plus, Archive, Download, UtensilsCrossed, Package, Plane, Pencil, Receipt, History, Users, WalletCards } from 'lucide-react';
import { format } from 'date-fns';
import { exportApi } from '@/api/exportApi';
import { ExpenseFilters } from '@/components/expense/ExpenseFilters';
import { SettleToggle } from '@/components/expense/SettleToggle';
import { BulkSettleModal } from '@/components/expense/BulkSettleModal';
import { SettlementHistory } from '@/components/expense/SettlementHistory';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const formatDate = (val) => {
  if (!val) return '—';
  try { return format(new Date(val), 'dd MMM yyyy'); } catch { return '—'; }
};

const formatAmount = (val) => {
  const n = Number(val);
  if (isNaN(n)) return 'Rs.0';
  return `Rs.${n.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
};

export const Expenses = () => {
  const user = useAuthStore(s => s.user);
  const isPrivileged = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // activeTab: 'my' | 'all' | 'history' | 'previous'
  const [activeTab, setActiveTab] = useState('my');
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
  const defaultPreviousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const defaultPreviousYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
  const [previousFilters, setPreviousFilters] = useState({
    page: 1,
    limit: 10,
    year: defaultPreviousYear,
    quarter: defaultPreviousQuarter,
  });
  const debouncedSearch = useDebouncedValue(filters.search || '', 300);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showBulkSettleModal, setShowBulkSettleModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
  const navigate = useNavigate();

  // For "My Expenses" tab always scope to current user
  const debouncedFilters = { ...filters, search: debouncedSearch || undefined };
  if (!debouncedFilters.search) delete debouncedFilters.search;
  const myFilters = { ...debouncedFilters, employee_ids: user?.id || user?._id, scope: 'me' };
  // For "All Expenses" tab, use filters as-is (managers/admins see all)
  const previousExpenseFilters = { ...previousFilters, scope: 'all' };
  const activeFilters = activeTab === 'previous'
    ? previousExpenseFilters
    : activeTab === 'my' ? myFilters : { ...debouncedFilters, scope: 'all' };

  const { data, isLoading } = useExpenses(activeTab === 'history' ? null : activeFilters);
  const { data: expenseYears } = useExpenseYears();
  const { data: quarterSnapshots, isLoading: isSnapshotLoading } = useQuarterSnapshots(
    activeTab === 'previous'
      ? { year: previousFilters.year, quarter: previousFilters.quarter }
      : null
  );
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const archiveMutation = useArchiveExpense();
  const settleMutation = useSettleExpense();

  const defaultForm = {
    expense_type: '',
    title: '',
    description: '',
    amount: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
  };
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!form.expense_type) errors.expense_type = 'Select an expense type';
    if (!form.title?.trim()) errors.title = 'Title is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errors.amount = 'Enter a valid amount';
    if (!form.expense_date) errors.expense_date = 'Select a date';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateForm = () => {
    setEditingExpense(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (expense) => {
    setEditingExpense(expense);
    setForm({
      expense_type: expense.expense_type || expense.expenseType || '',
      title: expense.title || '',
      description: expense.description || '',
      amount: String(expense.amount || ''),
      expense_date: expense.expense_date || expense.expenseDate
        ? format(new Date(expense.expense_date || expense.expenseDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      expense_type: form.expense_type,
      expenseType: form.expense_type,
      title: form.title.trim(),
      description: form.description?.trim() || '',
      amount: parseFloat(form.amount),
      expenseDate: form.expense_date,
    };

    try {
      if (editingExpense) {
        await updateMutation.mutateAsync({ id: editingExpense.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditingExpense(null);
    } catch {
      // error handled by hook
    }
  };

  const handleArchive = async () => {
    if (!showArchiveConfirm) return;
    await archiveMutation.mutateAsync({ id: showArchiveConfirm, data: {} });
    setShowArchiveConfirm(null);
  };

  const handleExportExcel = async () => {
    try {
      await exportApi.expensesExcel(activeFilters);
      toast.success('Export started');
    } catch {
      toast.error('Export failed');
    }
  };

  // Columns for "My Expenses" — no employee column needed
  const myColumns = [
    {
      key: 'expense_type', label: 'Type',
      width: '90px',
      render: (val) => <TypeChip type={val} />,
    },
    {
      key: 'title', label: 'Title',
      width: '200px',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]" title={val}>{val}</p>
          {row.description && (
            <p className="text-[11px] text-gray-400 truncate max-w-[200px]" title={row.description}>{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      width: '110px',
      render: (val) => <span className="font-semibold text-gray-900 whitespace-nowrap">{formatAmount(val)}</span>,
    },
    {
      key: 'expense_date', label: 'Expense Date',
      width: '120px',
      render: (val) => <span className="text-gray-600 whitespace-nowrap">{formatDate(val)}</span>,
    },
    {
      key: 'updated_at', label: 'Last Updated',
      width: '110px',
      className: 'hidden lg:table-cell',
      render: (val) => <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(val)}</span>,
    },
    {
      key: 'is_settled', label: 'Status & Settlement',
      width: '180px',
      render: (val, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <SettleToggle
              isSettled={val}
              onToggle={() => settleMutation.mutate(row.id)}
              disabled={true}
            />
          </div>
          {val ? (
            <div className="text-[10px] text-gray-500 mt-0.5 space-y-0.5 leading-tight">
              <div><span className="font-medium text-gray-600">By:</span> {row.settled_by_name || 'System Operator'}</div>
              {row.settled_at && <div><span className="font-medium text-gray-600">On:</span> {format(new Date(row.settled_at), 'dd MMM yyyy, h:mm a')}</div>}
            </div>
          ) : (
            <div className="text-[10px] text-gray-400 mt-0.5 italic">Not settled yet</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      width: '100px',
      render: (_, row) => {
        const isOwner = row.employeeId === user?.id;
        return (
          <div className="flex items-center gap-1">
            {isOwner && !row.is_settled && !row.is_archived && (
              <button onClick={(e) => { e.stopPropagation(); openEditForm(row); }} className="p-2 rounded-btn hover:bg-gray-100 text-gray-500">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {!row.is_archived && (
              <button onClick={(e) => { e.stopPropagation(); setShowArchiveConfirm(row.id); }} className="p-2 rounded-btn hover:bg-gray-100 text-red-500">
                <Archive className="w-4 h-4" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); navigate(`/expenses/history/${row.id}`); }} className="p-2 rounded-btn hover:bg-gray-100 text-gray-500">
              <History className="w-4 h-4" />
            </button>
          </div>
        );
      }
    },
  ];

  // Columns for "All Employees" tab — includes employee name column, full settle toggle for privileged
  const allColumns = [
    {
      key: 'employee_name', label: 'Employee',
      width: '140px',
      render: (val) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{val || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'expense_type', label: 'Type',
      width: '90px',
      render: (val) => <TypeChip type={val} />,
    },
    {
      key: 'title', label: 'Title',
      width: '180px',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]" title={val}>{val}</p>
          {row.description && (
            <p className="text-[11px] text-gray-400 truncate max-w-[180px]" title={row.description}>{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      width: '110px',
      render: (val) => <span className="font-semibold text-gray-900 whitespace-nowrap">{formatAmount(val)}</span>,
    },
    {
      key: 'expense_date', label: 'Expense Date',
      width: '120px',
      render: (val) => <span className="text-gray-600 whitespace-nowrap">{formatDate(val)}</span>,
    },
    {
      key: 'updated_at', label: 'Last Updated',
      width: '110px',
      className: 'hidden lg:table-cell',
      render: (val) => <span className="text-gray-500 text-xs whitespace-nowrap">{formatDate(val)}</span>,
    },
    {
      key: 'is_settled', label: 'Status & Settlement',
      width: '180px',
      render: (val, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <SettleToggle
              isSettled={val}
              onToggle={() => settleMutation.mutate(row.id)}
              disabled={settleMutation.isPending}
            />
          </div>
          {val ? (
            <div className="text-[10px] text-gray-500 mt-0.5 space-y-0.5 leading-tight">
              <div><span className="font-medium text-gray-600">By:</span> {row.settled_by_name || 'System Operator'}</div>
              {row.settled_at && <div><span className="font-medium text-gray-600">On:</span> {format(new Date(row.settled_at), 'dd MMM yyyy, h:mm a')}</div>}
            </div>
          ) : row.settlementHistory?.length > 0 ? (
            <div className="text-[10px] text-amber-600 mt-0.5 space-y-0.5 leading-tight">
              <div>Marked Unsettled</div>
              <div><span className="font-medium">By:</span> {row.settlementHistory[row.settlementHistory.length - 1].performed_by_name || 'System Operator'}</div>
            </div>
          ) : (
            <div className="text-[10px] text-gray-400 mt-0.5 italic">Not settled yet</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {!row.is_archived && (
            <button onClick={(e) => { e.stopPropagation(); setShowArchiveConfirm(row.id); }} className="p-2 rounded-btn hover:bg-gray-100 text-red-500">
              <Archive className="w-4 h-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); navigate(`/expenses/history/${row.id}`); }} className="p-2 rounded-btn hover:bg-gray-100 text-gray-500">
            <History className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const expenses = data?.data || [];
  const meta = data?.meta;
  const years = expenseYears?.length ? expenseYears : [currentYear, currentYear - 1, currentYear - 2];
  const quarters = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' },
  ];
  const snapshot = quarterSnapshots?.[0];

  return (
    <PageLayout title="Expenses">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <h1 className="text-xl font-semibold text-gray-900">Expenses</h1>
            <div className="tabs-scroll flex items-center gap-4 overflow-x-auto md:border-l md:border-gray-300 md:pl-6">
              {/* My Expenses tab — all roles */}
              <button
                onClick={() => { setActiveTab('my'); setFilters({ page: 1, limit: 10 }); }}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === 'my'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Expenses
              </button>

              {/* All Employees tab — privileged only */}
              {isPrivileged && (
                <button
                  onClick={() => { setActiveTab('all'); setFilters({ page: 1, limit: 10 }); }}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  All Employees
                </button>
              )}

              {/* Settlement History tab — privileged only */}
              {isPrivileged && (
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Settlement History
                </button>
              )}

              {isPrivileged && (
                <button
                  onClick={() => setActiveTab('previous')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'previous'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Previous Quarters
                </button>
              )}
            </div>
          </div>

          {activeTab !== 'history' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              {isPrivileged && activeTab === 'all' && (
                <Button variant="secondary" onClick={() => setShowBulkSettleModal(true)} className="w-full sm:w-auto">
                  Settle
                </Button>
              )}
              <Button variant="secondary" onClick={handleExportExcel} className="w-full sm:w-auto">
                <Download className="w-4 h-4" /> Export Excel
              </Button>
              {activeTab !== 'previous' && (
                <Button onClick={openCreateForm} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> New Expense
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'my' && (
          <>
            <ExpenseFilters filters={filters} setFilters={setFilters} showEmployeeFilter={false} />
            <Table
              columns={myColumns}
              data={expenses}
              loading={isLoading}
              emptyMessage={
                <div className="flex flex-col items-center py-8">
                  <Receipt className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No expenses found</p>
                  <p className="text-gray-400 text-xs mt-1">Add a new expense to get started</p>
                </div>
              }
              rowClassName={(row) => row.is_settled ? 'opacity-60' : ''}
            />
            {meta && (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
              />
            )}
          </>
        )}

        {activeTab === 'all' && isPrivileged && (
          <>
            <ExpenseFilters filters={filters} setFilters={setFilters} showEmployeeFilter={true} />
            <Table
              columns={allColumns}
              data={expenses}
              loading={isLoading}
              emptyMessage={
                <div className="flex flex-col items-center py-8">
                  <Receipt className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No expenses found</p>
                  <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                </div>
              }
              rowClassName={(row) => row.is_settled ? 'opacity-60' : ''}
            />
            {meta && (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
              />
            )}
          </>
        )}

        {activeTab === 'history' && isPrivileged && (
          <SettlementHistory />
        )}

        {activeTab === 'previous' && isPrivileged && (
          <>
            <div className="bg-white rounded-card border border-[#e5e7eb] p-4 flex flex-col sm:flex-row gap-3">
              <Select
                label="Year"
                value={previousFilters.year}
                onChange={(e) => setPreviousFilters(f => ({ ...f, year: Number(e.target.value), page: 1 }))}
                className="w-full sm:w-40"
              >
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </Select>
              <Select
                label="Quarter"
                value={previousFilters.quarter}
                onChange={(e) => setPreviousFilters(f => ({ ...f, quarter: Number(e.target.value), page: 1 }))}
                className="w-full sm:w-48"
              >
                {quarters.map((quarter) => <option key={quarter.value} value={quarter.value}>{quarter.label}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="bg-white rounded-card border border-[#e5e7eb] p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Snapshot Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(snapshot?.totalExpense || 0)}</p>
              </div>
              <div className="bg-white rounded-card border border-[#e5e7eb] p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Settled</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatAmount(snapshot?.settledTotal || 0)}</p>
              </div>
              <div className="bg-white rounded-card border border-[#e5e7eb] p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Unsettled</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{formatAmount(snapshot?.unsettledTotal || 0)}</p>
              </div>
              <div className="bg-white rounded-card border border-[#e5e7eb] p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Top Category</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{snapshot?.topCategory || 'N/A'}</p>
                {snapshot?.createdAt && <p className="text-xs text-gray-400 mt-1">Saved {formatDate(snapshot.createdAt)}</p>}
              </div>
            </div>

            {!isSnapshotLoading && !snapshot && (
              <div className="bg-white rounded-card border border-[#e5e7eb] p-4 text-sm text-gray-500">
                No saved snapshot exists yet for this quarter. It will be created automatically 15 days after the quarter ends.
              </div>
            )}

            <Table
              columns={allColumns}
              data={expenses}
              loading={isLoading || isSnapshotLoading}
              emptyMessage="No expenses found for this quarter"
              rowClassName={(row) => row.is_settled ? 'opacity-60' : ''}
            />
            {meta && (
              <Pagination
                page={meta.page}
                limit={meta.limit}
                total={meta.total}
                onPageChange={(p) => setPreviousFilters(f => ({ ...f, page: p }))}
              />
            )}
          </>
        )}
      </div>

      {/* Create/Edit Expense Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Expense' : 'New Expense'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Expense Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { type: 'FOOD', icon: UtensilsCrossed, label: 'Food' },
                { type: 'OTHER', icon: Package, label: 'Other' },
                { type: 'TRIP', icon: Plane, label: 'Trip' },
                { type: 'TEAM_FUND', icon: WalletCards, label: 'Team Fund' },
              ].map(({ type, icon: Icon, label }) => (
                <div
                  key={type}
                  onClick={() => { setForm(f => ({ ...f, expense_type: type })); setFormErrors(e => ({ ...e, expense_type: '' })); }}
                  className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    form.expense_type === type
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${form.expense_type === type ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${form.expense_type === type ? 'text-primary' : 'text-gray-600'}`}>{label}</span>
                </div>
              ))}
            </div>
            {formErrors.expense_type && <p className="text-xs text-red-500 mt-1">{formErrors.expense_type}</p>}
          </div>

          <Input
            label="Title"
            placeholder="e.g. Team lunch, Office supplies..."
            value={form.title}
            onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setFormErrors(e2 => ({ ...e2, title: '' })); }}
            error={formErrors.title}
            required
          />

          <Textarea
            label="Description (optional)"
            placeholder="Add details about this expense..."
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            className="min-h-[80px]"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount (Rs.)"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => { setForm(f => ({ ...f, amount: e.target.value })); setFormErrors(e2 => ({ ...e2, amount: '' })); }}
              error={formErrors.amount}
              required
            />
            <Input
              label="Expense Date"
              type="date"
              value={form.expense_date}
              onChange={(e) => { setForm(f => ({ ...f, expense_date: e.target.value })); setFormErrors(e2 => ({ ...e2, expense_date: '' })); }}
              error={formErrors.expense_date}
              required
            />
          </div>

          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setEditingExpense(null); }} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation?.isPending}
              className="w-full md:w-auto"
            >
              {editingExpense ? 'Update Expense' : 'Submit Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      <BulkSettleModal isOpen={showBulkSettleModal} onClose={() => setShowBulkSettleModal(false)} />

      <ConfirmModal
        isOpen={!!showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(null)}
        onConfirm={handleArchive}
        title="Archive Expense"
        message="This will be archived, not permanently deleted. You can restore it later."
        confirmText="Archive"
      />
    </PageLayout>
  );
};
