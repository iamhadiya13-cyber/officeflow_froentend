import { create } from 'zustand';

const THEME_STORAGE_KEY = 'officeflow-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
};

const persistTheme = (theme) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  mobileOpen: false,
  theme: getInitialTheme(),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setMobileOpen: (val) => set({ mobileOpen: val }),
  setTheme: (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    persistTheme(nextTheme);
    set({ theme: nextTheme });
  },
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    persistTheme(nextTheme);
    return { theme: nextTheme };
  }),
}));
