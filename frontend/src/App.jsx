import { useEffect } from 'react';
import AppRouter     from './router/AppRouter';
import useThemeStore from './store/themeStore';
import useAuthStore  from './store/authStore';
import { refreshAccessToken } from './api/axios';

export default function App() {
  const apply = useThemeStore((s) => s.apply);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  useEffect(() => {
    apply();
  }, [apply]);

  // El accessToken no se persiste (ver authStore.js) — si había una sesión
  // (queda un `user` persistido), se pide un token nuevo con la cookie httpOnly
  // de refresh antes de decidir qué rutas mostrar.
  useEffect(() => {
    const { user, clearAuth, setBootstrapped } = useAuthStore.getState();
    if (!user) { setBootstrapped(); return; }
    refreshAccessToken()
      .catch(() => clearAuth())
      .finally(() => setBootstrapped());
  }, []);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <AppRouter />;
}
