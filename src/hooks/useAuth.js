import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      const loginData = res.data.data;
      // Server wraps: { user: {...}, mustChangePassword: bool }
      // Store just the user object so user.id, user.role etc work correctly
      const userObj = loginData.user ?? loginData;
      setUser(userObj);
      if (loginData.mustChangePassword) {
        navigate('/change-password');
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      /* ignore */
    } finally {
      clearUser();
      navigate('/login');
      toast.success('Logged out');
    }
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  return { user, isAuthenticated, login, logout, hasRole };
};

import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data } = await userApi.getUsers({ limit: 1000 });
      return data;
    },
  });
};

// Works for ALL roles (EMPLOYEE, MANAGER, SUPER_ADMIN) — used in filter dropdowns
export const useEmployeeList = () => {
  return useQuery({
    queryKey: ['employee-list'],
    queryFn: async () => {
      const { data } = await userApi.getEmployeeList();
      return data;
    },
    staleTime: 60 * 1000,
  });
};
