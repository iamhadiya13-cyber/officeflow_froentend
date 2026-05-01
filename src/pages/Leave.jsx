import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Input, Select, Textarea } from '@/components/ui/Input';
import {
  useLeaveRequests, useLeaveTypes, useLeaveBalances, useCreateLeave,
  useDeleteLeave, useReviewLeave, useAddExtraLeavesBulk
} from '@/hooks/useLeave';
import { useEmployeeList } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { LeaveBalances } from '@/components/leave/LeaveBalances';

const calcDays = (start, end) => {
  if (!start || !end) return 0;
  let count = 0;
  const current = new Date(start);
  const endDate = new Date(end);
  current.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return Math.max(count, 0);
};

const ReviewDrawer = ({ request, onClose, onApprove, onReject, isPending }) => {
  const [note, setNote] = useState('');
  if (!request) return null;
  return (
    <Drawer isOpen={!!request} onClose={onClose} title="Review Leave Request">
      <div className="space-y-4">
        <div className="space-y-2 pb-4 border-b border-[#e5e7eb]">
          <p className="text-sm"><span className="text-gray-500">Employee:</span> {request.employee_name}</p>
          <p className="text-sm"><span className="text-gray-500">From:</span> {format(new Date(request.start_date), 'dd MMM yyyy')}</p>
          <p className="text-sm"><span className="text-gray-500">To:</span> {format(new Date(request.end_date), 'dd MMM yyyy')}</p>
          <p className="text-sm"><span className="text-gray-500">Days:</span> {request.total_days}</p>
          {request.reason && <p className="text-sm"><span className="text-gray-500">Reason:</span> {request.reason}</p>}
        </div>
        <Textarea label="Review Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => onReject(request.id, note)} loading={isPending} className="flex-1 !text-red-600 !border-red-200">
            <XCircle className="w-4 h-4" /> Reject
          </Button>
          <Button onClick={() => onApprove(request.id, note)} loading={isPending} className="flex-1">
            <CheckCircle className="w-4 h-4" /> Approve
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export const Leave = () => {
  const user = useAuthStore(s => s.user);
  const isManager = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState('my');
  const [filters, setFilters] = useState({ page: 1, limit: 10 });

  const [showForm, setShowForm] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showReview, setShowReview] = useState(null);

  // My Leave always shows only this user's own requests
  const myLeaveFilters = activeTab === 'my' ? { ...filters, employee_id: user?.id } : undefined;
  // Team Leave shows all team members' requests (for managers)
  const teamLeaveFilters = activeTab === 'team' ? filters : undefined;
  // Strip undefined values to prevent them being sent as string "undefined" in query params
  const cleanParams = (obj) => obj ? Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) : undefined;

  const { data, isLoading } = useLeaveRequests(cleanParams(myLeaveFilters ?? teamLeaveFilters));
  const { data: leaveTypes } = useLeaveTypes();
  const { data: balances } = useLeaveBalances('');
  const { data: employeeListData } = useEmployeeList();
  
  const currentUserId = user?.id || user?._id;
  const myBalance = balances?.find(b => String(b.user_id) === String(currentUserId));
  const myLeaveTotal = myBalance?.total_allowed ?? 12;
  const myLeaveUsed = myBalance?.used_days ?? 0;
  const myLeaveRemaining = myBalance?.remaining_days ?? myLeaveTotal;
  const myLeaveExtra = myBalance?.extra_leaves ?? 0;

  const createMutation = useCreateLeave();
  const deleteMutation = useDeleteLeave();
  const reviewMutation = useReviewLeave();
  const addExtraLeavesMutation = useAddExtraLeavesBulk();

  const [form, setForm] = useState({ employee_id: user?.id || '', start_date: '', end_date: '', duration_mode: 'full', total_days: 0, reason: '' });
  const [addLeaveForm, setAddLeaveForm] = useState({ mode: 'selected', employee_id: '', extra_days: 1, reason: '' });
  const employeeOptions = employeeListData?.data || [];
  const selectedFormBalance = balances?.find(b => String(b.user_id) === String(form.employee_id || currentUserId));

  const handleDateChange = (field, value) => {
    const updated = { ...form, [field]: value };
    if (updated.duration_mode === 'half') {
      if (field === 'start_date') updated.end_date = value;
      updated.total_days = updated.start_date ? 0.5 : 0;
    } else {
      updated.total_days = calcDays(updated.start_date, updated.end_date);
    }
    setForm(updated);
  };

  const handleDurationChange = (mode) => {
    const updated = { ...form, duration_mode: mode };
    if (mode === 'half') {
      updated.end_date = updated.start_date;
      updated.total_days = updated.start_date ? 0.5 : 0;
    } else {
      updated.total_days = calcDays(updated.start_date, updated.end_date);
    }
    setForm(updated);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const annualType = leaveTypes?.find(t => t.name === 'Annual Leave');
    await createMutation.mutateAsync({ ...form, leave_type_id: annualType?.id });
    setShowForm(false);
    setForm({ employee_id: user?.id || '', start_date: '', end_date: '', duration_mode: 'full', total_days: 0, reason: '' });
  };

  const noLeaves = selectedFormBalance && selectedFormBalance.remaining_days <= 0;

  const leaveColumns = [
    ...(isManager && activeTab === 'team' ? [{ key: 'employee_name', label: 'Employee', className: 'font-medium' }] : []),
    { key: 'leave_type_name', label: 'Type', className: 'hidden sm:table-cell' },
    { key: 'start_date', label: 'From', render: (v) => format(new Date(v), 'dd MMM yyyy') },
    { key: 'end_date', label: 'To', render: (v) => format(new Date(v), 'dd MMM yyyy') },
    { key: 'total_days', label: 'Days' },
    { key: 'reason', label: 'Reason', className: 'hidden md:table-cell truncate max-w-[200px]' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {isManager && activeTab === 'team' && row.status === 'pending' && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); reviewMutation.mutate({ id: row.id, data: { status: 'approved', review_note: '' } }); }} 
                className="p-1 px-2 rounded-btn bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold flex items-center gap-1 border border-green-200"
              >
                <CheckCircle className="w-3 h-3" /> Approve
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); reviewMutation.mutate({ id: row.id, data: { status: 'rejected', review_note: '' } }); }} 
                className="p-1 px-2 rounded-btn bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center gap-1 border border-red-200"
              >
                <XCircle className="w-3 h-3" /> Reject
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowReview(row); }} className="p-1.5 rounded-btn hover:bg-gray-100 text-gray-500 ml-1" title="Review with Note">
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
          {(isManager || (row.employee_id === user?.id && row.status === 'pending')) && (
            <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row.id); }} className="p-2 rounded-btn hover:bg-gray-100 text-red-400" title="Delete Leave">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
  ];

  const tabs = [
    { id: 'my', label: 'My Leave' },
    ...(isManager ? [
      { id: 'team', label: 'Team Leave' },
      { id: 'balances', label: 'Leave Balances' },
    ] : []),
  ];

  return (
    <PageLayout title="Leave">
      <div className="space-y-5">
        {!isManager && (
          <div className="bg-white rounded-card border border-[#e5e7eb] p-4">
            {myBalance ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">My Annual Leave</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-3xl font-bold ${myLeaveRemaining > 4 ? 'text-green-600' : myLeaveRemaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                        {myLeaveRemaining} days
                      </span>
                      <span className="text-gray-400 text-sm">remaining</span>
                      {myLeaveExtra > 0 && (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-100">
                          Includes {myLeaveExtra} extra
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{myLeaveUsed} of {myLeaveTotal} days used</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-card border border-[#e5e7eb] bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Leave</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{myLeaveTotal} days</p>
                  </div>
                  <div className="rounded-card border border-[#e5e7eb] bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Used Leave</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{myLeaveUsed} days</p>
                  </div>
                  <div className="rounded-card border border-[#e5e7eb] bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{myLeaveRemaining} days</p>
                  </div>
                  <div className="rounded-card border border-[#e5e7eb] bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Extra Leave</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{myLeaveExtra} days</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-amber-500 text-lg font-bold">!</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">No Annual Leave Balance</p>
                  <p className="text-xs text-gray-500">Your annual leave balance has not been created yet. Please contact your manager.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="tabs-scroll flex items-center gap-5 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                  activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isManager && (
              <Button variant="secondary" onClick={() => setShowAddLeaveModal(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Add Leave
              </Button>
            )}
            {activeTab === 'my' && (
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4" /> {isManager ? 'Request Leave' : 'Request Leave'}
              </Button>
            )}
          </div>
        </div>

        {activeTab !== 'balances' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select
              value={filters.status || ''}
              onChange={(e) => {
                const val = e.target.value || undefined;
                setFilters(f => ({ ...f, status: val, page: 1 }));
              }}
              className="w-full sm:w-auto sm:min-w-[140px]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        )}

        {activeTab === 'balances' ? (
          <LeaveBalances user={user} />
        ) : (
          <>
            <Table columns={leaveColumns} data={data?.data} loading={isLoading} emptyMessage="No leave requests found" />
            {data?.meta && (
              <Pagination page={data.meta.page} limit={data.meta.limit} total={data.meta.total} onPageChange={(p) => setFilters(f => ({ ...f, page: p }))} />
            )}
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Request Leave">
        <form onSubmit={handleCreate} className="space-y-4">
          {isManager && (
            <Select
              label="Employee"
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              required
            >
              <option value="">Select employee</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </Select>
          )}

          <div className="flex flex-col sm:flex-row gap-3 relative mb-2">
            <div 
              className="border-2 border-primary bg-primary/5 rounded-card p-4 flex-1"
            >
              <h3 className="font-semibold text-gray-900 mb-1">Annual Leave</h3>
              <p className={`text-sm ${selectedFormBalance?.remaining_days > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedFormBalance ? `${selectedFormBalance.remaining_days} of ${selectedFormBalance.total_allowed} days remaining` : '12 days available'}
              </p>
            </div>
          </div>
          
          {noLeaves && (
            <div className="mb-4 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
              You have no annual leaves remaining.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 relative mb-2">
            <div 
              onClick={() => handleDurationChange('full')}
              className={`border rounded-card p-3 cursor-pointer flex-1 transition-all text-center ${
                form.duration_mode === 'full' ? 'border-2 border-primary bg-primary/5 text-primary font-semibold' : 'border-[#e5e7eb] hover:border-gray-300 bg-white text-gray-700'
              }`}
            >
              Full Day
            </div>
            <div 
              onClick={() => handleDurationChange('half')}
              className={`border rounded-card p-3 cursor-pointer flex-1 transition-all text-center ${
                form.duration_mode === 'half' ? 'border-2 border-primary bg-primary/5 text-primary font-semibold' : 'border-[#e5e7eb] hover:border-gray-300 bg-white text-gray-700'
              }`}
            >
              Half Day
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => handleDateChange('start_date', e.target.value)} required />
            {form.duration_mode === 'full' && (
              <Input label="End Date" type="date" value={form.end_date} onChange={(e) => handleDateChange('end_date', e.target.value)} required />
            )}
          </div>
          
          {form.start_date && form.end_date && form.total_days > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-badge bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100 w-fit">
              Working days: {form.total_days} (weekends excluded)
            </div>
          )}
          
          <Textarea label="Reason" value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} required />
          
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)} className="w-full md:w-auto">Cancel</Button>
            <Button 
              type="submit" 
              loading={createMutation.isPending} 
              disabled={noLeaves}
              className="w-full md:w-auto"
            >
              {isManager ? 'Save leave' : 'Submit request'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddLeaveModal} onClose={() => setShowAddLeaveModal(false)} title="Add Leave Days">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addExtraLeavesMutation.mutateAsync({
              apply_to_all: addLeaveForm.mode === 'all',
              employee_ids: addLeaveForm.mode === 'selected' ? [addLeaveForm.employee_id] : employeeOptions.map((employee) => employee.id),
              extra_days: Number(addLeaveForm.extra_days),
              reason: addLeaveForm.reason,
            });
            setShowAddLeaveModal(false);
            setAddLeaveForm({ mode: 'selected', employee_id: '', extra_days: 1, reason: '' });
          }}
          className="space-y-4"
        >
          <Select label="Select Employee" value={addLeaveForm.mode} onChange={(e) => setAddLeaveForm((f) => ({ ...f, mode: e.target.value }))}>
            <option value="selected">Selected Employee</option>
            <option value="all">All Employees</option>
          </Select>
          {addLeaveForm.mode === 'selected' && (
            <Select
              label="Employee"
              value={addLeaveForm.employee_id}
              onChange={(e) => setAddLeaveForm((f) => ({ ...f, employee_id: e.target.value }))}
              required
            >
              <option value="">Select employee</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </Select>
          )}
          <Input
            label="Extra Days"
            type="number"
            min={1}
            value={addLeaveForm.extra_days}
            onChange={(e) => setAddLeaveForm((f) => ({ ...f, extra_days: e.target.value }))}
            required
          />
          <Textarea label="Reason" value={addLeaveForm.reason} onChange={(e) => setAddLeaveForm((f) => ({ ...f, reason: e.target.value }))} />
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddLeaveModal(false)} className="w-full md:w-auto">Cancel</Button>
            <Button type="submit" loading={addExtraLeavesMutation.isPending} disabled={addLeaveForm.mode === 'selected' && !addLeaveForm.employee_id} className="w-full md:w-auto">
              Add Leave Days
            </Button>
          </div>
        </form>
      </Modal>

      <ReviewDrawer
        request={showReview}
        onClose={() => setShowReview(null)}
        onApprove={(id, note) => { reviewMutation.mutate({ id, data: { status: 'approved', review_note: note } }); setShowReview(null); }}
        onReject={(id, note) => { reviewMutation.mutate({ id, data: { status: 'rejected', review_note: note } }); setShowReview(null); }}
        isPending={reviewMutation.isPending}
      />
    </PageLayout>
  );
};
