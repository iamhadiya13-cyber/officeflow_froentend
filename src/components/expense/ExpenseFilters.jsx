import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, ChevronDown, Users } from 'lucide-react';
import { expenseApi } from '@/api/expenseApi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useEmployeeList } from '@/hooks/useAuth';
import { useClickOutside } from '@/hooks/useClickOutside';

export const ExpenseFilters = ({ filters, setFilters, showEmployeeFilter = false, showPeriodFilters = true, summaryFilters = null }) => {
  const [summary, setSummary] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  useClickOutside(monthDropdownRef, () => setMonthDropdownOpen(false));

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
  const selectedMonths = useMemo(() => {
    const source = filters.months || filters.month || '';
    return String(source).split(',').map(Number).filter((month) => month >= 1 && month <= 12);
  }, [filters.months, filters.month]);

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
    switch (k) {
      case 'employee_ids':
        return `Employee: ${employees.find(e => e.id === v)?.name || 'Unknown'}`;
      case 'expense_type': return `Type: ${v}`;
      case 'is_settled': return `Settlement: ${v === 'true' ? 'Settled' : 'Unsettled'}`;
      case 'search': return `Search: "${v}"`;
      case 'month': return `Month: ${months[v - 1]}`;
      case 'months': return `Months: ${String(v).split(',').map((month) => months[Number(month) - 1]).filter(Boolean).join(', ')}`;
      case 'year': return `Year: ${v}`;
      case 'from': return `From: ${v}`;
      case 'to': return `To: ${v}`;
      default: return `${k}: ${v}`;
    }
  };

  const toggleMonth = (monthValue) => {
    setFilters((f) => {
      const current = String(f.months || f.month || '').split(',').map(Number).filter((month) => month >= 1 && month <= 12);
      const nextMonths = current.includes(monthValue)
        ? current.filter((month) => month !== monthValue)
        : [...current, monthValue].sort((a, b) => a - b);
      const next = { ...f, year: fixedYear, page: 1 };
      delete next.month;
      delete next.quarter;
      delete next.from;
      delete next.to;
      if (nextMonths.length) next.months = nextMonths.join(',');
      else delete next.months;
      return next;
    });
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
        className={isMobile && !filtersOpen ? 'overflow-hidden' : 'overflow-visible'}
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
                <div className="relative w-full sm:w-auto sm:min-w-[180px]" ref={monthDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setMonthDropdownOpen((open) => !open)}
                    className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-btn text-sm flex items-center justify-between hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-left"
                  >
                    <span className="truncate text-gray-700">
                      {selectedMonths.length === 0
                        ? 'All Months'
                        : selectedMonths.length === 1
                          ? months[selectedMonths[0] - 1]
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
                        {months.map((month, index) => {
                          const monthValue = index + 1;
                          const checked = selectedMonths.includes(monthValue);
                          return (
                            <button
                              key={monthValue}
                              type="button"
                              onClick={() => toggleMonth(monthValue)}
                              className="w-full flex items-center gap-3 px-2 py-2 rounded text-left text-gray-900 hover:bg-gray-50"
                            >
                              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'}`}>
                                {checked && <span className="w-2 h-2 rounded-sm bg-white" />}
                              </span>
                              <span className="text-sm font-medium">{month}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Select value={filters.year || fixedYear} onChange={(e) => updateFilter('year', e.target.value)} className="w-full sm:w-auto sm:min-w-[140px]">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </>
            )}

            <Input
              placeholder="Search title/desc..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full sm:w-auto sm:w-[240px]"
            />

            <Button variant="secondary" onClick={() => setFilters({ page: 1, limit: filters.limit || 10 })} className="w-full sm:w-auto min-h-[40px]">
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

