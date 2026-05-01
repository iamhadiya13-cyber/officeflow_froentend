import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Menu } from 'lucide-react';

export const Topbar = ({ title }) => {
  const user = useAuthStore(s => s.user);
  const { sidebarCollapsed, setMobileOpen } = useUiStore();
  const isMobile = useMediaQuery('(max-width: 767px)');

  return (
    <header
      className="bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4 py-3 md:px-8 md:py-4 sticky top-0 z-20 h-auto md:h-16 w-full"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex md:hidden items-center justify-center p-2 rounded-btn hover:bg-gray-100 min-h-[44px] min-w-[44px]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base md:text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
