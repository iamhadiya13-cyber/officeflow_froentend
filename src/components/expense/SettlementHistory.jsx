import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettlements } from '@/hooks/useExpenses';
import { expenseApi } from '@/api/expenseApi';
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
    year: '',
    months: '',
    quarter: '',
    employee_ids: '',
  });

  const { data, isLoading } = useSettlements(filters);

  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const empDropdownRef = useRef(null);
  useClickOutside(empDropdownRef, () => setEmpDropdownOpen(false));
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);
  useClickOutside(monthDropdownRef, () => setMonthDropdownOpen(false));

  const years = [currentYear, currentYear - 1, currentYear - 2].map(String);
  const quarters = [
    { value: '1', label: 'Q1 (Jan–Mar)', months: [1, 2, 3] },
    { value: '2', label: 'Q2 (Apr–Jun)', months: [4, 5, 6] },
    { value: '3', label: 'Q3 (Jul–Sep)', months: [7, 8, 9] },
    { value: '4', label: 'Q4 (Oct–Dec)', months: [10, 11, 12] },
  ];

  const handleQuarterChange = (qVal) => {
    if (!qVal) {
      setFilters(f => ({ ...f, quarter: '', months: '', page: 1 }));
      return;
    }
    setFilters(f => ({ ...f, quarter: qVal, months: '', page: 1 }));
  };


  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await expenseApi.getSettlementEmployees({ year: filters.year });
        const list = (res.data?.data || []).map((u) => ({
          id: u.employeeId,
          name: u.employee_name,
          department: u.department,
        }));
        setEmployees(list);
      } catch {
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, [filters.year]);

  const selectedEmployeeIds = useMemo(() => {
    if (!filters.employee_ids) return [];
    return filters.employee_ids.split(',').filter(Boolean);
  }, [filters.employee_ids]);

  const handleEmployeesChange = (ids) => {
    setFilters(f => ({ ...f, employee_ids: ids.length > 0 ? ids.join(',') : '', page: 1 }));
  };
  const selectedMonths = useMemo(() => {
    return String(filters.months || '')
      .split(',')
      .map(Number)
      .filter((month) => month >= 1 && month <= 12);
  }, [filters.months]);
  const toggleMonth = (monthValue) => {
    setFilters((f) => {
      const current = String(f.months || '')
        .split(',')
        .map(Number)
        .filter((month) => month >= 1 && month <= 12);
      const nextMonths = current.includes(monthValue)
        ? current.filter((month) => month !== monthValue)
        : [...current, monthValue].sort((a, b) => a - b);
      return {
        ...f,
        months: nextMonths.length > 0 ? nextMonths.join(',') : '',
        quarter: '',
        page: 1,
      };
    });
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
        <div className="relative w-full sm:w-[180px]" ref={monthDropdownRef}>
          <button
            type="button"
            onClick={() => setMonthDropdownOpen((open) => !open)}
            className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-btn text-sm flex items-center justify-between hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-left"
          >
            <span className="truncate text-gray-700">
              {selectedMonths.length === 0
                ? 'All Months'
                : selectedMonths.length === 1
                  ? months[selectedMonths[0]].label
                  : `${selectedMonths.length} months`}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${monthDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {monthDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{ transformOrigin: 'top' }}
                className="absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-[220px] bg-white border border-[#e5e7eb] shadow-xl rounded-xl p-2"
              >
                {months.filter((month) => month.value).map((month) => {
                  const monthValue = Number(month.value);
                  const checked = selectedMonths.includes(monthValue);
                  return (
                    <button
                      key={month.value}
                      type="button"
                      onClick={() => toggleMonth(monthValue)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded text-left text-gray-900 hover:bg-gray-50"
                    >
                      <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'}`}>
                        {checked && <span className="w-2 h-2 rounded-sm bg-white" />}
                      </span>
                      <span className="text-sm font-medium">{month.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
