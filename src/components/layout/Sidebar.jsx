import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  LayoutDashboard, Receipt, CalendarDays, Plane, Users, PiggyBank,
  UserCircle, LogOut, ChevronLeft, X
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/leave', icon: CalendarDays, label: 'Leave' },
  { to: '/trips', icon: Plane, label: 'Trips' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/budget', icon: PiggyBank, label: 'Budget', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export const Sidebar = ({ onLogout }) => {
  const { sidebarCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useUiStore();
  const user = useAuthStore(s => s.user);
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const filteredItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        className="fixed inset-y-0 left-0 z-30 bg-sidebar flex flex-col"
        initial={false}
        animate={{ x: isMobile ? (mobileOpen ? 0 : '-100%') : 0, width: isMobile ? 260 : (sidebarCollapsed ? 56 : 260) }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-white font-semibold text-lg whitespace-nowrap overflow-hidden"
              >
                OfficeFlow
              </motion.span>
            )}
          </AnimatePresence>
          {isMobile ? (
            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-white/60" />
            </button>
          ) : (
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-white/10 hidden md:block">
              <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }}>
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </motion.div>
            </button>
          )}
        </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 bg-white/10 rounded-lg mx-2"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                />
              )}
              <div
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm relative z-10 transition-colors ${
                  isActive ? 'text-white border-l-2 border-primary' : 'text-[#a0a0b8] hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {(!sidebarCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 text-[#a0a0b8] hover:text-red-400 hover:bg-white/5 rounded-lg w-full text-sm transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  );
};
