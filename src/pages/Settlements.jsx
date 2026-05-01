import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { expenseApi } from '@/api/expenseApi';
import { useBatchSettleExpenses } from '@/hooks/useExpenses';

export const Settlements = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({ month: String(currentMonth), year: String(currentYear) });
  const batchMutation = useBatchSettleExpenses();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['settlement-employees', filters],
    queryFn: () => expenseApi.getSettlementEmployees(filters).then((response) => response.data.data),
  });

  const handleSettleEmployee = async (employeeId) => {
    await batchMutation.mutateAsync({
      filters: {
        employee_ids: employeeId,
        month: Number(filters.month),
        year: Number(filters.year),
      },
      targetStatus: true,
      note: `Settled from settlement dashboard for ${filters.month}/${filters.year}`,
    });
  };

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String);

  const columns = [
    { key: 'employee_name', label: 'Employee' },
    { key: 'department', label: 'Department', className: 'hidden md:table-cell' },
    { key: 'total_amount', label: 'Total Expense', render: (value) => `Rs.${Number(value || 0).toLocaleString('en-IN')}` },
    { key: 'unsettled_amount', label: 'Pending', render: (value) => `Rs.${Number(value || 0).toLocaleString('en-IN')}` },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => {
        if (value === 'no_expenses') {
          return <span className="text-xs font-medium px-2.5 py-0.5 rounded-badge bg-gray-100 text-gray-600">No expenses</span>;
        }
        if (value === 'settled') {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-badge bg-green-50 text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All settled
            </span>
          );
        }
        return (
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-badge bg-amber-50 text-amber-700">
            {row.unsettled_count} pending
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        row.unsettled_count > 0 ? (
          <Button
            onClick={() => handleSettleEmployee(row.employeeId)}
            loading={batchMutation.isPending}
            className="whitespace-nowrap"
          >
            Settle
          </Button>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      ),
    },
  ];

  return (
    <PageLayout title="Expense Settlements" subtitle="All employees stay visible even when they have no expenses or no pending expenses">
      <div className="space-y-6">
        <div className="bg-white rounded-card shadow-sm border border-[#e5e7eb] p-4 flex flex-col sm:flex-row gap-3">
          <Select value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))} className="w-full sm:w-[180px]">
            {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </Select>
          <Select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))} className="w-full sm:w-[140px]">
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </Select>
        </div>

        {isError ? (
          <div className="bg-white rounded-card shadow-sm border border-[#e5e7eb] p-6 text-sm text-red-600">
            Failed to load settlement employees.
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-sm border border-[#e5e7eb] overflow-hidden">
            <Table
              data={data || []}
              columns={columns}
              loading={isLoading}
              emptyMessage="No employees found"
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
};
