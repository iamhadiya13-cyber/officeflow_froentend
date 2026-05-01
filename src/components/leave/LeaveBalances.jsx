import { Table } from '@/components/ui/Table';
import { useLeaveBalances, useAddExtraLeavesBulk } from '@/hooks/useLeave';
import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ManageLeavesDrawer } from './ManageLeavesDrawer';
import { useEmployeeList } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown } from 'lucide-react';
import { EmployeeCheckboxList } from '@/components/ui/EmployeeCheckboxList';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';

export const LeaveBalances = ({ user }) => {
  const { data, isLoading } = useLeaveBalances('');
  const { data: usersData } = useEmployeeList();
  const bulkAddMutation = useAddExtraLeavesBulk();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    mode: 'selected',
    employee_id: '',
    extra_days: 1,
    reason: '',
  });
  
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const empDropdownRef = useRef(null);
  
  useClickOutside(empDropdownRef, () => setEmpDropdownOpen(false));

  const employees = useMemo(() => {
    return (usersData?.data || []).map(u => ({
      id: u.id, name: u.name, department: u.department
    }));
  }, [usersData]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (selectedEmployeeIds.length === 0 || selectedEmployeeIds.length === employees.length) return data;
    const selected = new Set(selectedEmployeeIds.map(String));
    return data.filter(d => {
      const rowUserId = d.user_id || d.userId || d.user?.id || d.user?._id;
      return selected.has(String(rowUserId));
    });
  }, [data, selectedEmployeeIds, employees.length]);

  const bulkTargets = useMemo(() => filteredData, [filteredData]);

  const columns = [
    { key: 'employee_name', label: 'Employee', className: 'truncate max-w-[150px] font-medium' },
    { key: 'department', label: 'Department' },
    { key: 'total_allowed', label: 'Total Allowed', render: (val) => `${val} days` },
    { key: 'used_days', label: 'Used', render: (val) => `${val} days` },
    {
      key: 'remaining_days', label: 'Remaining',
      render: (val, row) => {
        let pct = (row.used_days / row.total_allowed) * 100;
        let color = val > 4 ? 'bg-green-500' : val > 0 ? 'bg-amber-500' : 'bg-red-500';
        return (
          <div className="w-full max-w-[120px] group relative">
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>{val} left</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(pct, 100)}%` }} className={`h-full ${color} transition-all`} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'extra_leaves', label: 'Extra Leaves',
      render: (val) => val > 0 ? <span className="text-green-600 font-medium">+{val} days</span> : '-'
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}>
          Manage Leaves
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#e5e7eb] rounded-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full sm:w-[300px]" ref={empDropdownRef}>
            <button
              type="button"
              onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
              className="w-full h-10 px-3 bg-white border border-[#e5e7eb] rounded-btn text-sm flex items-center justify-between hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-left"
            >
              <div className="flex items-center gap-2 truncate text-gray-700">
                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">
                  {selectedEmployeeIds.length === 0
                    ? 'All Employees'
                    : selectedEmployeeIds.length === 1
                      ? employees.find(e => e.id === selectedEmployeeIds[0])?.name || '1 selected'
                      : `${selectedEmployeeIds.length} employees`}
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
                    onChange={setSelectedEmployeeIds}
                    maxHeight="300px"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button onClick={() => setShowAddLeaveModal(true)} className="w-full md:w-auto">
            Add Leave
          </Button>
        </div>
      </div>

      <Table columns={columns} data={filteredData} loading={isLoading} emptyMessage="No balances found" />
      <ManageLeavesDrawer isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} employee={selectedUser} />

      <Modal isOpen={showAddLeaveModal} onClose={() => setShowAddLeaveModal(false)} title="Add Leave Days">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await bulkAddMutation.mutateAsync({
              apply_to_all: bulkForm.mode === 'all',
              employee_ids: bulkForm.mode === 'selected'
                ? [bulkForm.employee_id]
                : bulkTargets.map((employee) => employee.user_id),
              extra_days: Number(bulkForm.extra_days),
              reason: bulkForm.reason,
            });
            setShowAddLeaveModal(false);
            setBulkForm({ mode: 'selected', employee_id: '', extra_days: 1, reason: '' });
          }}
          className="space-y-4"
        >
          <Select
            label="Apply To"
            value={bulkForm.mode}
            onChange={(e) => setBulkForm((form) => ({ ...form, mode: e.target.value }))}
          >
            <option value="selected">Selected Employee</option>
            <option value="all">All Filtered Employees</option>
          </Select>

          {bulkForm.mode === 'selected' && (
            <Select
              label="Employee"
              value={bulkForm.employee_id}
              onChange={(e) => setBulkForm((form) => ({ ...form, employee_id: e.target.value }))}
              required
            >
              <option value="">Select employee</option>
              {bulkTargets.map((employee) => (
                <option key={employee.user_id} value={employee.user_id}>{employee.employee_name}</option>
              ))}
            </Select>
          )}

          <Input
            label="Add Leave Days"
            type="number"
            min={1}
            value={bulkForm.extra_days}
            onChange={(e) => setBulkForm((form) => ({ ...form, extra_days: e.target.value }))}
            required
          />
          <Textarea
            label="Reason"
            value={bulkForm.reason}
            onChange={(e) => setBulkForm((form) => ({ ...form, reason: e.target.value }))}
            required
          />
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddLeaveModal(false)} className="w-full md:w-auto">Cancel</Button>
            <Button
              type="submit"
              loading={bulkAddMutation.isPending}
              disabled={bulkForm.mode === 'selected' && !bulkForm.employee_id}
              className="w-full md:w-auto"
            >
              Extend Leave
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
