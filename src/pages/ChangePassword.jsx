import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Loader2 } from 'lucide-react';
import { authApi } from '@/api/authApi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const clearUser = useAuthStore(s => s.clearUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // The currentPassword is not needed since the backend does not require it
      // when mustChangePassword is true, but it expects newPassword.
      await authApi.changePassword({ newPassword });
      toast.success('Password changed successfully. Please log in again.');
      clearUser();
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearUser();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-pagebg flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-card border border-[#e5e7eb] p-6 sm:p-8 w-full max-w-md shadow-xl shadow-gray-200/70"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Change Password</h1>
          <p className="text-sm text-gray-500 mt-1">Your account requires a password change.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="bg-primary text-white rounded-btn px-5 py-2.5 text-sm font-medium hover:bg-primary-hover w-full flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </motion.button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel & Log out
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
