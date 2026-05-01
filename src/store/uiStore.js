import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  mobileOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setMobileOpen: (val) => set({ mobileOpen: val }),
}));
