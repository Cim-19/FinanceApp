import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe }   from '../api/auth';

const useAuthStore = create(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,

      setAuth:  (user, accessToken) => set({ user, accessToken }),
      updateUser: (partial)         => set((s) => ({ user: { ...s.user, ...partial } })),
      clearAuth:  ()                => set({ user: null, accessToken: null }),

      // Sincroniza user con el servidor — llamar después de operaciones que cambian el plan
      refreshUser: async () => {
        try {
          const { data } = await getMe();
          const u = data.data;
          set((s) => ({
            user: {
              ...s.user,
              name:     u.name,
              email:    u.email,
              currency: u.currency,
              theme:    u.theme,
              role:     u.role,
              plan:     u.subscription?.plan || 'FREE',
            },
          }));
        } catch { /* token expirado u otro error — ignorar, el interceptor de axios maneja el refresh */ }
      },
    }),
    {
      name:       'finance-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);

export default useAuthStore;
