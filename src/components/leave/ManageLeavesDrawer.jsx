import { useState } from 'react';
import { useAddExtraLeaves, useAdjustExtraLeaves, useLeaveRequests } from '@/hooks/useLeave';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';

export const ManageLeavesDrawer = ({ isOpen, onClose, employee }) => {
  const user = useAuthStore(s => s.user);
  const [extraDays, setExtraDays] = useState(1);
  const [extraReason, setExtraReason] = useState('');
  
  const [adjDays, setAdjDays] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  const addMut = useAddExtraLeaves();
  const adjMut = useAdjustExtraLeaves();

  const { data: history } = useLeaveRequests({ employee_id: employee?.user_id, limit: 5 });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!employee) return;
    await addMut.mutateAsync({ userId: employee.user_id, data: { extra_days: Number(extraDays), reason: extraReason } });
    setExtraDays(1);
    setExtraReason('');
    onClose();
  };

  const handleAdj = async (e) => {
    e.preventDefault();
    if (!employee) return;
    await adjMut.mutateAsync({ userId: employee.user_id, data: { adjustment: Number(adjDays), reason: adjReason } });
    setAdjDays(0);
    setAdjReason('');
    onClose();
  };

  if (!employee) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Manage Leaves">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{employee.employee_name}</h3>
          <p className="text-sm text-gray-500">{employee.department}</p>
        </div>

        <div className="bg-white border text-sm border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Annual</span>
            <span className="font-medium text-gray-900">12 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Extra</span>
            <span className={`font-medium ${employee.extra_leaves > 0 ? 'text-green-600' : 'text-gray-900'}`}>{employee.extra_leaves} days</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-500 font-medium">Total Allowed</span>
            <span className="font-semibold text-gray-900">{employee.total_allowed} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Used</span>
            <span className="font-semibold text-gray-900">{employee.used_days} days</span>
          </div>
          <div className="flex justify-between items-center bg-gray-50 p-2 rounded -mx-2">
            <span className="text-gray-700 font-bold">Remaining</span>
            <span className={`text-xl font-bold ${employee.remaining_days > 4 ? 'text-green-600' : employee.remaining_days > 0 ? 'text-amber-500' : 'text-red-600'}`}>
              {employee.remaining_days} days
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Extra Leaves</h4>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input type="number" label="Number of days" min={1} max={30} value={extraDays} onChange={e => setExtraDays(e.target.value)} required />
            <Textarea label="Reason" value={extraReason} onChange={e => setExtraReason(e.target.value)} required />
            <Button type="submit" className="w-full" loading={addMut.isPending}>Add Extra Leaves</Button>
          </form>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Adjust Balance (Admin Only)</h4>
            <form onSubmit={handleAdj} className="space-y-3">
              <Input type="number" label="Adjustment Value (+ or -)" value={adjDays} onChange={e => setAdjDays(e.target.value)} required />
              <Textarea label="Reason" value={adjReason} onChange={e => setAdjReason(e.target.value)} required />
              <Button type="submit" variant="destructive" className="w-full" loading={adjMut.isPending}>Adjust Balance</Button>
            </form>
          </div>
        )}

        {history?.data?.length > 0 && (
          <div className="border-t border-gray-200 pt-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Leave History</h4>
            <div className="space-y-2">
              {history.data.map(h => (
                <div key={h.id} className="flex justify-between items-center text-sm border border-gray-100 p-2 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{h.total_days} days</p>
                    <p className="text-xs text-gray-500">{format(new Date(h.start_date), 'dd MMM')} - {format(new Date(h.end_date), 'dd MMM')}</p>
                  </div>
                  <Badge status={h.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
