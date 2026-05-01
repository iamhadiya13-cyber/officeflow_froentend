import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/authApi';
import api from '@/api/axios';
import { User, Lock, Building, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const Profile = () => {
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile/me').then(r => r.data.data),
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileForm, setProfileForm] = useState({ name: '', department: '' });
  const [editMode, setEditMode] = useState(false);

  const updateProfile = useMutation({
    mutationFn: (data) => api.put('/profile/me', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setUser(res.data.data);
      toast.success('Profile updated');
      setEditMode(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const changePassword = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed. Please log in again.');
      window.location.href = '/login';
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePassword.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
  };

  return (
    <PageLayout title="Profile">
      <div className="max-w-3xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-card border border-[#e5e7eb] p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold">
              {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile?.name || user?.name}</h2>
              <p className="text-sm text-gray-500">{profile?.role?.replace('_', ' ') || user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 min-w-0">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{profile?.email || user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Building className="w-4 h-4 text-gray-400" />
              {profile?.department || user?.department || 'N/A'}
            </div>
          </div>

          {!editMode ? (
            <Button variant="secondary" className="mt-4" onClick={() => {
              setProfileForm({ name: profile?.name || '', department: profile?.department || '' });
              setEditMode(true);
            }}>
              <User className="w-4 h-4" /> Edit Profile
            </Button>
          ) : (
            <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
              <Input label="Name" value={profileForm.name} onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Department" value={profileForm.department} onChange={(e) => setProfileForm(f => ({ ...f, department: e.target.value }))} />
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button variant="secondary" type="button" onClick={() => setEditMode(false)} className="w-full sm:w-auto">Cancel</Button>
                <Button type="submit" loading={updateProfile.isPending} className="w-full sm:w-auto">Save</Button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="bg-white rounded-card border border-[#e5e7eb] p-5 sm:p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Change Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
            />
            <Button type="submit" loading={changePassword.isPending} className="w-full sm:w-auto">Update Password</Button>
          </form>
        </motion.div>
      </div>
    </PageLayout>
  );
};
