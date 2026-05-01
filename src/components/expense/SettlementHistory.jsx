import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettlements } from '@/hooks/useExpenses';
import { useEmployeeList } from '@/hooks/useAuth';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Input';
import { TypeChip } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { Users, ChevronDown } from 'lucide-react';
import { EmployeeCheckboxList } from '@/components/ui/EmployeeCheckboxList';
import { useClickOutside } from '@/hooks/useClickOutside';

const months = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export const SettlementHistory = () => {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    page: 1, limit: 10,
    year: String(currentYear),
    month: '',
    quarter: '',
    employee_ids: '',
  });

  const { data, isLoading } = useSettlements(filters);
  const { data: usersData } = useEmployeeList();

  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empDropdownRef = useRef(null);
  useClickOutside(empDropdownRef, () => setEmpDropdownOpen(false));

  const years = [currentYear, currentYear - 1, currentYear - 2].map(String);
  const quarters = [
    { value: '1', label: 'Q1 (Jan–Mar)', months: [1, 2, 3] },
    { value: '2', label: 'Q2 (Apr–Jun)', months: [4, 5, 6] },
    { value: '3', label: 'Q3 (Jul–Sep)', months: [7, 8, 9] },
    { value: '4', label: 'Q4 (Oct–Dec)', months: [10, 11, 12] },
  ];

  const handleQuarterChange = (qVal) => {
    if (!qVal) {
      setFilters(f => ({ ...f, quarter: '', month: '', page: 1 }));
      return;
    }
    setFilters(f => ({ ...f, quarter: qVal, month: '', page: 1 }));
  };


  const employees = useMemo(() => {
    return (usersData?.data || []).map(u => ({
      id: u.id, name: u.name, department: u.department
    }));
  }, [usersData]);

  const selectedEmployeeIds = useMemo(() => {
    if (!filters.employee_ids) return [];
    return filters.employee_ids.split(',').filter(Boolean);
  }, [filters.employee_ids]);

  const handleEmployeesChange = (ids) => {
    setFilters(f => ({ ...f, employee_ids: ids.length > 0 ? ids.join(',') : '', page: 1 }));
  };

  const formatAmount = (val) => `Rs.${Number(val || 0).toLocaleString('en-IN')}`;
  const formatDate = (val) => {
    if (!val) return '—';
    try { return format(new Date(val), 'dd MMM yyyy, HH:mm'); } catch { return '—'; }
  };

  const columns = [
    {
      key: 'employee_name', label: 'Employee',
      render: (val) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{val}</p>
        </div>
      ),
    },
    {
      key: 'expense_type', label: 'Type',
      render: (val) => <TypeChip type={val} />,
    },
    {
      key: 'title', label: 'Title',
      render: (val) => <span className="text-sm text-gray-700 font-medium">{val}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      render: (val) => <span className="font-semibold text-gray-900">{formatAmount(val)}</span>,
    },
    {
      key: 'expense_date', label: 'Expense Date',
      render: (val) => <span className="text-gray-600 text-sm">{val ? format(new Date(val), 'dd MMM yyyy') : '—'}</span>,
    },
    {
      key: 'settled_by_name', label: 'Settled By',
      render: (val) => <span className="text-sm text-gray-700">{val || '—'}</span>,
    },
    {
      key: 'settled_at', label: 'Settled At',
      render: (val) => <span className="text-sm text-gray-500">{formatDate(val)}</span>,
    },
    {
      key: 'note', label: 'Note',
      className: 'hidden lg:table-cell',
      render: (val) => <span className="text-xs text-gray-400 italic">{val || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e5e7eb] rounded-card p-4 flex flex-wrap gap-3">
        {/* Employee filter */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px]" ref={empDropdownRef}>
          <button
            type="button"
            onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
            className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-btn text-sm flex items-center justify-between hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-left"
          >
            <div className="flex items-center gap-2 truncate text-gray-700">
              <Users className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">
                {selectedEmployeeIds.length === 0
                  ? 'All Team Members'
                  : selectedEmployeeIds.length === 1
                    ? employees.find(e => e.id === selectedEmployeeIds[0])?.name || '1 selected'
                    : `${selectedEmployeeIds.length} members`}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${empDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {empDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ transformOrigin: 'top' }}
                className="absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-[260px] bg-white border border-[#e5e7eb] shadow-xl rounded-xl p-2"
              >
                <EmployeeCheckboxList
                  employees={employees}
                  selected={selectedEmployeeIds}
                  onChange={handleEmployeesChange}
                  maxHeight="300px"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Month filter */}
        <Select
          value={filters.quarter ? '' : filters.month}
          onChange={(e) => setFilters(f => ({ ...f, month: e.target.value, quarter: '', page: 1 }))}
          className="w-full sm:w-[150px]"
        >
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>

        {/* Quarter filter */}
        <Select
          value={filters.quarter || ''}
          onChange={(e) => handleQuarterChange(e.target.value)}
          className="w-full sm:w-[160px]"
        >
          <option value="">All Quarters</option>
          {quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
        </Select>

        {/* Year filter */}
        <Select
          value={filters.year}
          onChange={(e) => setFilters(f => ({ ...f, year: e.target.value, page: 1 }))}
          className="w-full sm:w-[120px]"
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      <Table
        columns={columns}
        data={data?.data}
        loading={isLoading}
        emptyMessage="No settlement history found"
      />

      {data?.meta && (
        <Pagination
          page={data.meta.page}
          limit={data.meta.limit}
          total={data.meta.total}
          onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
};
