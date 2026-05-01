import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { format } from 'date-fns';
import { CheckCircle, WalletCards } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const getFundStatus = async (year) => {
  const { data } = await api.get(`/fund?year=${year}`);
  return data.data;
};

const collectFund = async (payload) => {
  const { data } = await api.post('/fund/collect', payload);
  return data;
};

export const TeamFund = () => {
  const user = useAuthStore(s => s.user);
  const isManager = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['team-fund', selectedYear],
    queryFn: () => getFundStatus(selectedYear)
  });

  const collectMutation = useMutation({
    mutationFn: collectFund,
    onSuccess: () => {
      toast.success('Payment collected successfully');
      queryClient.invalidateQueries(['team-fund', selectedYear]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to collect payment');
    }
  });

  const handleCollect = (employeeId, type) => {
    collectMutation.mutate({ employeeId, type, year: selectedYear });
  };

  const users = data?.users || [];
  
  const filteredUsers = users.filter(u => {
    if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { 
      key: 'name', 
      label: 'Employee', 
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900">{v}</div>
          <div className="text-xs text-gray-500">{row.role} • {row.department || 'No Dept'}</div>
        </div>
      )
    },
    { 
      key: 'dateOfBirth', 
      label: 'Birthday', 
      render: (v) => v ? format(new Date(v), 'dd MMM yyyy') : <span className="text-gray-400">Not Set</span>
    },
    {
      key: 'birthdayCollected',
      label: 'Birthday Fund (₹1,250)',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {v ? (
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-badge w-fit">
                <CheckCircle className="w-3 h-3" /> Paid
              </span>
              <span className="text-[10px] text-gray-500 mt-1">By {row.birthdayCollectedBy} on {format(new Date(row.birthdayCollectedAt), 'dd MMM')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-badge w-fit">
                Pending
              </span>
              {isManager && row.dateOfBirth && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="!py-1 !px-2 !text-xs"
                  onClick={() => handleCollect(row.id, 'BIRTHDAY')}
                  loading={collectMutation.isPending && collectMutation.variables?.employeeId === row.id && collectMutation.variables?.type === 'BIRTHDAY'}
                >
                  Mark Paid
                </Button>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'promotionCollected',
      label: 'Promotion Fund (₹1,000)',
      render: (v, row) => {
        // Interns shouldn't pay promotion fund unless they get promoted.
        // We show it for everyone but only managers can mark it.
        return (
          <div className="flex items-center gap-2">
            {v ? (
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-badge w-fit">
                  <CheckCircle className="w-3 h-3" /> Paid
                </span>
                <span className="text-[10px] text-gray-500 mt-1">By {row.promotionCollectedBy} on {format(new Date(row.promotionCollectedAt), 'dd MMM yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 italic">Not Paid</span>
                {isManager && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="!py-1 !px-2 !text-xs"
                    onClick={() => handleCollect(row.id, 'PROMOTION')}
                    loading={collectMutation.isPending && collectMutation.variables?.employeeId === row.id && collectMutation.variables?.type === 'PROMOTION'}
                  >
                    Mark Paid
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      }
    }
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <PageLayout title="Team Fund">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Team Fund Management</h1>
          
          <div className="bg-white px-4 py-3 rounded-card border border-[#e5e7eb] flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <WalletCards className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{data?.currentBalance?.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card border border-[#e5e7eb] p-4 flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-48">
            <Select 
              label="Select Year" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-64">
            <Input 
              label="Search Employee" 
              placeholder="Enter name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-card border border-[#e5e7eb] overflow-hidden">
          <Table columns={columns} data={filteredUsers} loading={isLoading} emptyMessage="No employees found" />
        </div>
      </div>
    </PageLayout>
  );
};
