import { motion } from 'framer-motion';
import { useUiStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const PageLayout = ({ title, children }) => {
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed);
  const { logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <div className="flex min-h-[calc(100vh-2rem)] mt-8 bg-[#f8f8f8]">
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
        <main className="flex-1 p-4 md:p-8 w-full">
          {children}
        </main>
      </motion.div>
    </div>
  );
};
