import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: false,

      toggle: () => {
        const next = !get().isDark;
        document.documentElement.classList.toggle('dark', next);
        set({ isDark: next });
      },

      apply: () => {
        document.documentElement.classList.toggle('dark', get().isDark);
      },
    }),
    { name: 'finance-theme' }
  )
);

export default useThemeStore;
