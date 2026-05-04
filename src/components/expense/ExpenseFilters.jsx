import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, ChevronDown, Users } from 'lucide-react';
import { expenseApi } from '@/api/expenseApi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useEmployeeList } from '@/hooks/useAuth';

export const ExpenseFilters = ({ filters, setFilters, showEmployeeFilter = false, showPeriodFilters = true, summaryFilters = null }) => {
  const [summary, setSummary] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const { data: employeeListData } = useEmployeeList();

  const employees = useMemo(() => {
    return (employeeListData?.data || []).map(u => ({
      id: u.id, name: u.name, department: u.department
    }));
  }, [employeeListData]);

  const selectedEmployeeId = filters.employee_ids || '';
  const effectiveSummaryFilters = summaryFilters || filters;
  const summaryKey = JSON.stringify(effectiveSummaryFilters);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fixedYear = 2026;
  const years = [fixedYear];
  const quarters = [
    { value: '1', label: 'Q1 (Jan–Mar)', months: [1, 2, 3] },
    { value: '2', label: 'Q2 (Apr–Jun)', months: [4, 5, 6] },
    { value: '3', label: 'Q3 (Jul–Sep)', months: [7, 8, 9] },
    { value: '4', label: 'Q4 (Oct–Dec)', months: [10, 11, 12] },
  ];

  const updateFilter = (key, value) => {
    setFilters(f => {
      const copy = { ...f };
      if (!value) delete copy[key];
      else copy[key] = value;
      copy.page = 1;
      return copy;
    });
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await expenseApi.getPersonSummary(effectiveSummaryFilters);
        setSummary(res.data.data);
      } catch {
        // silent
      }
    };
    const timeoutId = setTimeout(fetchSummary, 300);
    return () => clearTimeout(timeoutId);
  }, [summaryKey]);

  const activeChips = Object.entries(filters).filter(([k, v]) => v && k !== 'page' && k !== 'limit' && k !== 'is_archived');

  const renderChipLabel = (k, v) => {
    switch(k) {
      case 'employee_ids': 
        return `Employee: ${employees.find(e => e.id === v)?.name || 'Unknown'}`;
      case 'expense_type': return `Type: ${v}`;
      case 'is_settled': return `Settlement: ${v === 'true' ? 'Settled' : 'Unsettled'}`;
      case 'search': return `Search: "${v}"`;
      case 'month': return `Month: ${months[v - 1]}`;
      case 'year': return `Year: ${v}`;
      case 'quarter': return `Q${v}`;
      case 'from': return `From: ${v}`;
      case 'to': return `To: ${v}`;
      case 'min_amount': return `Min: Rs.${v}`;
      case 'max_amount': return `Max: Rs.${v}`;
      default: return `${k}: ${v}`;
    }
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    const newFilters = { ...filters, month: val || undefined, quarter: undefined, year: fixedYear, page: 1 };
    if (!val) delete newFilters.month;
    if (val) { delete newFilters.from; delete newFilters.to; delete newFilters.quarter; }
    setFilters(newFilters);
  };

  const handleQuarterChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setFilters(f => { const c = { ...f, page: 1 }; delete c.quarter; delete c.from; delete c.to; delete c.month; return c; });
      return;
    }
    const q = quarters.find(q => q.value === val);
    const y = fixedYear;
    const startMonth = q.months[0]; const endMonth = q.months[2];
    const from = `${y}-${String(startMonth).padStart(2,'0')}-01`;
    const lastDay = new Date(y, endMonth, 0).getDate();
    const to = `${y}-${String(endMonth).padStart(2,'0')}-${lastDay}`;
    setFilters(f => ({ ...f, quarter: val, year: fixedYear, from, to, month: undefined, page: 1 }));
  };

  return (
    <div className="space-y-4">
      {isMobile && (
        <Button variant="secondary" onClick={() => setFiltersOpen(!filtersOpen)} className="w-full flex items-center justify-between min-h-[44px]">
          <span>Filters</span>
          <motion.div animate={{ rotate: filtersOpen ? 180 : 0 }}><ChevronDown className="w-4 h-4" /></motion.div>
        </Button>
      )}
      
      <motion.div
        animate={{ height: (!isMobile || filtersOpen) ? 'auto' : 0, opacity: (!isMobile || filtersOpen) ? 1 : 0 }}
        className="overflow-hidden"
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-3 pb-2 md:pb-0 relative z-20">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            
            {showEmployeeFilter && (
              <div className="relative w-full sm:w-auto">
                <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Select
                  value={selectedEmployeeId}
                  onChange={(e) => updateFilter('employee_ids', e.target.value)}
                  className="pl-9 min-w-[200px]"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </Select>
              </div>
            )}

            <Select value={filters.expense_type || ''} onChange={(e) => updateFilter('expense_type', e.target.value)} className="w-full sm:w-auto sm:min-w-[140px]">
              <option value="">All Types</option>
              <option value="FOOD">Food</option>
              <option value="OTHER">Other</option>
              <option value="TRIP">Trip</option>
              <option value="TEAM_FUND">Team Fund</option>
            </Select>

            <Select value={filters.is_settled || ''} onChange={(e) => updateFilter('is_settled', e.target.value)} className="w-full sm:w-auto sm:min-w-[140px]">
              <option value="">All Settlement</option>
              <option value="false">Unsettled</option>
              <option value="true">Settled</option>
            </Select>

            {showPeriodFilters && (
              <>
                <Select value={filters.month || ''} onChange={handleMonthChange} className="w-full sm:w-auto sm:min-w-[140px]">
                  <option value="">All Months</option>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </Select>

                <Select value={filters.quarter || ''} onChange={handleQuarterChange} className="w-full sm:w-auto sm:min-w-[150px]">
                  <option value="">All Quarters</option>
                  {quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </Select>

                <Select value={filters.year || fixedYear} onChange={(e) => updateFilter('year', e.target.value)} className="w-full sm:w-auto sm:min-w-[140px]">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </>
            )}

            <Input 
              placeholder="Min Amount" 
              type="number" 
              value={filters.min_amount || ''} 
              onChange={(e) => updateFilter('min_amount', e.target.value)} 
              className="w-full sm:w-auto sm:min-w-[120px]"
            />
            
            <Input 
              placeholder="Max Amount" 
              type="number" 
              value={filters.max_amount || ''} 
              onChange={(e) => updateFilter('max_amount', e.target.value)} 
              className="w-full sm:w-auto sm:min-w-[120px]"
            />

            <Input 
              placeholder="Search title/desc..." 
              value={filters.search || ''} 
              onChange={(e) => updateFilter('search', e.target.value)} 
              className="w-full sm:w-auto sm:w-[240px]"
            />

            <Button variant="secondary" onClick={() => setFilters({ page: 1, limit: filters.limit || 10 })} className="w-full sm:w-auto min-h-[44px]">
              Clear All
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Summary Chips Rendering remains exactly the same below */}
      {(activeChips.length > 0 || (summary && summary.total_count > 0)) && (
        <div className="bg-white border border-[#e5e7eb] rounded-card p-4 space-y-3 relative z-10">
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {activeChips.map(([k, v]) => (
                <div key={k} className="inline-flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                  {renderChipLabel(k, v)}
                  <button onClick={() => updateFilter(k, '')} className="hover:bg-indigo-200 p-1 md:p-0.5 rounded-full min-h-[24px] min-w-[24px] flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {summary && (
            <div className="flex flex-col gap-1 md:flex-row md:justify-between md:items-center text-sm border-t border-gray-100 pt-2 mt-2">
              <span className="text-gray-500 font-medium">Showing {summary.total_count} expenses</span>
              <div className="flex flex-wrap gap-3 md:gap-4 font-medium">
                <span className="text-gray-900">Total: Rs.{Math.round(summary.total_amount || 0).toLocaleString('en-IN')}</span>
                <span className="text-green-600">Settled: Rs.{Math.round(summary.settled_amount || 0).toLocaleString('en-IN')}</span>
                <span className="text-amber-600">Unsettled: Rs.{Math.round(summary.unsettled_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
