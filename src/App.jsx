import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Expenses } from '@/pages/Expenses';
import { Leave } from '@/pages/Leave';
import { Trips } from '@/pages/Trips';
import { Users } from '@/pages/Users';
import { Budget } from '@/pages/Budget';
import { Profile } from '@/pages/Profile';
import { Settlements } from '@/pages/Settlements';
import { ExpenseHistory } from '@/pages/ExpenseHistory';
import { ChangePassword } from '@/pages/ChangePassword';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ children, roles }) => {
  const user = useAuthStore(s => s.user);
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
        <Route path="/expenses/history/:id" element={<PrivateRoute><ExpenseHistory /></PrivateRoute>} />
        <Route
          path="/expenses/settlements"
          element={
            <PrivateRoute>
              <Settlements />
            </PrivateRoute>
          }
        />
        <Route path="/leave" element={<PrivateRoute><Leave /></PrivateRoute>} />
        <Route path="/trips" element={<PrivateRoute><Trips /></PrivateRoute>} />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Users />
            </PrivateRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <PrivateRoute>
              <RoleRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                <Budget />
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

import { useMediaQuery } from '@/hooks/useMediaQuery';

export const App = () => {
  const isMobile = useMediaQuery('(max-width: 639px)');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-blue-500 text-white text-xs sm:text-sm font-medium text-center truncate h-8 flex items-center justify-center fixed top-0 w-full z-[9999]">
        This app is currently in beta testing. Please don’t complain about bugs or issues report them properly so we can fix them.
      </div>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position={isMobile ? "bottom-center" : "top-right"}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff', color: '#111', border: '1px solid #e5e7eb', borderRadius: '8px',
              maxWidth: '90vw', fontSize: '14px', fontFamily: 'Inter'
            },
          }}
          containerStyle={isMobile ? { bottom: 16, left: 16, right: 16 } : {}}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
