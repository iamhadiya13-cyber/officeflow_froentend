import { motion } from 'framer-motion';
import { useUiStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const PageLayout = ({ title, subtitle, actions, children }) => {
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed);
  const { logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex min-h-[calc(100vh-2rem)] mt-8 bg-pagebg">
      <Sidebar onLogout={logout} />
      <motion.div
        className="flex flex-col flex-1 min-w-0"
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 56 : 260),
          transition: 'margin-left 0.25s ease-in-out',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <Topbar title={title} />
        <main className="flex-1 w-full">
          <div className="w-full px-4 py-5 sm:px-5 md:px-8 md:py-8">
            {(subtitle || actions) && (
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-col sm:flex-row gap-2 sm:items-center">{actions}</div>}
              </div>
            )}
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
};
