import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Loader2 } from 'lucide-react';


export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err) {
      /* handled in hook */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pagebg flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-card border border-[#e5e7eb] p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">OfficeFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="admin@office.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
              required
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded-btn px-5 py-2.5 text-sm font-medium hover:bg-primary-hover w-full flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </motion.button>
        </form>

      </motion.div>
    </div>
  );
};
