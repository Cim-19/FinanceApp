import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe }   from '../api/auth';

const useAuthStore = create(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      // true hasta que App intenta renovar el accessToken (con la cookie httpOnly
      // de refresh) al cargar la página — evita que las rutas protegidas redirijan
      // a /login antes de saber si la sesión sigue siendo válida.
      isBootstrapping: true,

      setAuth:  (user, accessToken) => set({ user, accessToken }),
      updateUser: (partial)         => set((s) => ({ user: { ...s.user, ...partial } })),
      clearAuth:  ()                => set({ user: null, accessToken: null }),
      setBootstrapped: () => set({ isBootstrapping: false }),

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
      name: 'finance-auth',
      // El accessToken ya NO se persiste en localStorage — solo vive en memoria.
      // Así, un XSS que lea localStorage no obtiene un token utilizable; al
      // recargar la página, App vuelve a pedir uno nuevo con la cookie httpOnly
      // de refresh (ver App.jsx).
      partialize: (s) => ({ user: s.user }),
    }
  )
);

export default useAuthStore;
