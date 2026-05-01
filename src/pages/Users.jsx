import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageLayout } from '@/components/layout/PageLayout';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { userApi } from '@/api/userApi';
import { useAuthStore } from '@/store/authStore';

export const Users = () => {
  const currentUser = useAuthStore((s) => s.user);
  const roleOptions = ['EMPLOYEE', 'MANAGER'];

  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters).then((r) => r.data),
  });

  const managerQuery = useQuery({
    queryKey: ['user-managers'],
    queryFn: () => userApi.getUsers({ page: 1, limit: 100, role: 'MANAGER' }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => userApi.createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User created');
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }) => userApi.updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User updated');
      setEditUser(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    managerId: '',
  });

  const managers = useMemo(() => managerQuery.data?.data || [], [managerQuery.data]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      managerId: '',
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      managerId: form.role === 'EMPLOYEE' ? form.managerId || null : null,
    });
    resetForm();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: editUser.id,
      data: {
        name: editUser.name,
        role: editUser.role,
        department: editUser.department,
        managerId: editUser.role === 'EMPLOYEE' ? editUser.managerId || null : null,
        isActive: editUser.is_active,
      },
    });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-badge bg-indigo-50 text-indigo-800">
          {value?.replace('_', ' ')}
        </span>
      ),
    },
    { key: 'department', label: 'Department', className: 'hidden lg:table-cell' },
    { key: 'manager_name', label: 'Manager', className: 'hidden lg:table-cell' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => <Badge status={value ? 'approved' : 'archived'} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => format(new Date(value), 'dd MMM yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditUser({
                ...row,
                managerId: managers.find((manager) => manager.name === row.manager_name)?.id || '',
              });
            }}
            className="p-2 rounded-btn hover:bg-gray-100 text-gray-500"
          >
            <Edit className="w-4 h-4" />
          </button>
          {row.is_active && row.id !== currentUser?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row.id); }}
              className="p-2 rounded-btn hover:bg-gray-100 text-gray-500 hover:text-red-500"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageLayout title="Users">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="sm:!w-64"
            />
            <Select
              value={filters.role || ''}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined, page: 1 }))}
            >
              <option value="">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role.replace('_', ' ')}</option>
              ))}
            </Select>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>

        <Table columns={columns} data={data?.data || []} loading={isLoading} emptyMessage="No users found" />

        {data?.meta && (
          <Pagination
            page={data.meta.page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="Add User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, managerId: '' }))}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role.replace('_', ' ')}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
            {form.role === 'EMPLOYEE' && (
              <Select label="Manager" value={form.managerId} onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))} required>
                <option value="">Select manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </Select>
            )}
          </div>
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowForm(false); resetForm(); }} className="w-full md:w-auto">Cancel</Button>
            <Button type="submit" loading={createMutation.isPending} className="w-full md:w-auto">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Name" value={editUser.name} onChange={(e) => setEditUser((u) => ({ ...u, name: e.target.value }))} />
              <Select label="Role" value={editUser.role} onChange={(e) => setEditUser((u) => ({ ...u, role: e.target.value, managerId: '' }))}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Email" type="email" value={editUser.email} disabled />
              <Input label="Department" value={editUser.department || ''} onChange={(e) => setEditUser((u) => ({ ...u, department: e.target.value }))} />
            </div>
            {editUser.role === 'EMPLOYEE' && (
              <Select label="Manager" value={editUser.managerId || ''} onChange={(e) => setEditUser((u) => ({ ...u, managerId: e.target.value }))}>
                <option value="">Select manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>{manager.name}</option>
                ))}
              </Select>
            )}
            <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditUser(null)} className="w-full md:w-auto">Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending} className="w-full md:w-auto">Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </PageLayout>
  );
};
