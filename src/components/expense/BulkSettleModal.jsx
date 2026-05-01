import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { useEmployeeList } from '@/hooks/useAuth';
import { useBatchSettleExpenses } from '@/hooks/useExpenses';
import { expenseApi } from '@/api/expenseApi';

export const BulkSettleModal = ({ isOpen, onClose }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [employeeId, setEmployeeId] = useState('ALL');
  const [note, setNote] = useState('');
  
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: employeeListData } = useEmployeeList();
  const batchMutation = useBatchSettleExpenses();

  const employees = useMemo(() => {
    return (employeeListData?.data || []).map(u => ({
      id: u.id, name: u.name
    }));
  }, [employeeListData]);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];
  
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String);

  useEffect(() => {
    if (!isOpen) { 
      setPreview(null);
      setNote('');
      return; 
    }
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const filters = {
          month: parseInt(month),
          year: parseInt(year),
          is_settled: 'false',
        };
        if (employeeId !== 'ALL') {
          filters.employee_ids = employeeId;
        }

        const res = await expenseApi.getPersonSummary(filters);
        setPreview(res.data.data);
      } catch (err) {
         setPreview({ total_count: 0, total_amount: 0 });
      } finally {
        setPreviewLoading(false);
      }
    };
    const tid = setTimeout(fetchPreview, 300);
    return () => clearTimeout(tid);
  }, [month, year, employeeId, isOpen]);

  const handleSettle = async (e) => {
    e.preventDefault();
    if (preview?.unsettled_count === 0) return;

    try {
      const filters = {
        month: parseInt(month),
        year: parseInt(year)
      };
      if (employeeId !== 'ALL') {
         filters.employee_ids = employeeId;
      }
      
      await batchMutation.mutateAsync({ 
        filters, 
        targetStatus: true,
        note
      });
      onClose();
    } catch {
      // toast is handled in hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Settlement" maxWidth="max-w-lg">
      <form onSubmit={handleSettle} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)} required>
            <option value="">Select Month</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
          <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)} required>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>

        <Select label="Employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="ALL">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </Select>

        <Textarea 
          label="Settlement Note (Optional)" 
          placeholder="e.g., Bulk settlement for March..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Settlement Preview</h4>
          {previewLoading ? (
            <p className="text-sm text-gray-400">Calculating matching expenses...</p>
          ) : preview?.unsettled_count > 0 ? (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-800">
                <strong className="text-primary">{preview.unsettled_count}</strong> expenses will be marked as settled
              </span>
              <span className="font-bold text-gray-900">
                Total amount: Rs.{Math.round(preview.unsettled_amount).toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <p className="text-sm text-amber-600 font-medium">No unsettled expenses found matching these criteria.</p>
          )}
        </div>

        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-4 border-t border-gray-100">
          <Button variant="secondary" type="button" onClick={onClose} className="w-full md:w-auto">
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={batchMutation.isPending} 
            disabled={!preview || preview.unsettled_count === 0}
            className="w-full md:w-auto bg-primary text-white"
          >
            Settle Matching Expenses
          </Button>
        </div>
      </form>
    </Modal>
  );
};
