import { useState, useMemo, useEffect } from 'react';
import { useSettleMonth, useSettlePreview } from '@/hooks/useExpenses';
import { useEmployeeList } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { EmployeeCheckboxList } from '@/components/ui/EmployeeCheckboxList';

export const SettleMonthModal = ({ isOpen, onClose }) => {
  const mutation = useSettleMonth();
  const { data: usersData } = useEmployeeList();
  
  const employees = useMemo(() => {
    return (usersData?.data || []).map(u => ({
      id: u.id, name: u.name, department: u.department
    }));
  }, [usersData]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [note, setNote] = useState('');

  // Auto-select all on mount when employees load
  useEffect(() => {
    if (employees.length > 0 && selectedIds.length === 0 && isOpen) {
      const timeoutId = setTimeout(() => {
        setSelectedIds(employees.map(e => e.id));
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [employees, isOpen, selectedIds.length]);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2000, i), 'MMMM') }));
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];

  const paramsStr = selectedIds.join(',');
  const { data: previewData, isLoading: isPreviewLoading } = useSettlePreview({
    employee_ids: paramsStr, month, year
  });

  // The new backend returns an array of { employeeId, employee_name, count, total }
  const previewItems = Array.isArray(previewData) ? previewData : [];
  const totalToSettle = previewItems.reduce((sum, p) => sum + (p.total || 0), 0);
  const employeesWithExpenses = previewItems.filter(p => p.count > 0).length;
  const hasAnythingToSettle = previewItems.length > 0 && totalToSettle > 0;

  const handleSettle = async () => {
    if (!selectedIds.length) {
      toast.error('Please select at least one employee');
      return;
    }
    if (!hasAnythingToSettle) {
      toast.error('No unsettled expenses to settle');
      return;
    }
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      toast.error('Please select a valid month');
      return;
    }
    if (isNaN(yearNum) || yearNum < 2000) {
      toast.error('Please select a valid year');
      return;
    }
    await mutation.mutateAsync({ 
      employee_ids: selectedIds, 
      month: monthNum, 
      year: yearNum, 
      note 
    });
    onClose();
  };

  const selectedCount = selectedIds.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Expenses">
      <div className="space-y-5">
        
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Select Employees</h4>
          <div className="border border-[#e5e7eb] rounded-lg p-2 bg-white">
            <EmployeeCheckboxList 
              employees={employees} 
              selected={selectedIds} 
              onChange={setSelectedIds} 
              maxHeight="160px"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
          <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Preview</h4>
          
          {selectedCount === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center text-sm text-gray-500">
              Please select at least one employee.
            </div>
          ) : isPreviewLoading ? (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center text-sm text-gray-500 animate-pulse">
              Loading preview...
            </div>
          ) : previewItems.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-1.5 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                No unsettled expenses for this period.
              </div>
            </div>
          ) : (
            <div className="border border-[#e5e7eb] rounded-lg overflow-hidden text-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-[#e5e7eb] grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                <div className="col-span-5">Employee</div>
                <div className="col-span-3 text-center">Expenses</div>
                <div className="col-span-4 text-right">Amount</div>
              </div>
              <div className="max-h-[160px] overflow-y-auto divide-y divide-[#e5e7eb]">
                {previewItems.map(p => (
                  <div key={p.employeeId || p._id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-gray-900 bg-white">
                    <div className="col-span-5 font-medium truncate">{p.employee_name || p.name}</div>
                    <div className="col-span-3 text-center">{p.count}</div>
                    <div className="col-span-4 text-right font-semibold">
                      Rs.{Number(p.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 bg-gray-50 border-t border-[#e5e7eb]">
                <div className="flex justify-between items-center font-bold text-gray-900">
                  <span>Total to settle ({employeesWithExpenses} employee{employeesWithExpenses > 1 ? 's' : ''}):</span>
                  <span className="text-primary text-base">
                    Rs.{totalToSettle.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Textarea label="Settlement Note (Optional)" value={note} onChange={e => setNote(e.target.value)} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button 
            onClick={handleSettle} 
            loading={mutation.isPending}
            disabled={!hasAnythingToSettle || isPreviewLoading}
          >
            Settle Month
          </Button>
        </div>
      </div>
    </Modal>
  );
};
