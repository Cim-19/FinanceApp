import { useEffect } from 'react';
import { Outlet }    from 'react-router-dom';
import Sidebar            from './Sidebar';
import Navbar             from './Navbar';
import BottomNav          from './BottomNav';
import UpdateNotification from '../pwa/UpdateNotification';
import InstallPrompt      from '../pwa/InstallPrompt';
import useAuthStore       from '../../store/authStore';

export default function AppLayout() {
  const refreshUser = useAuthStore((s) => s.refreshUser);

  // Sincronizar plan desde el servidor al cargar la app
  useEffect(() => { refreshUser(); }, [refreshUser]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* Sidebar — solo desktop */}
      <aside className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Columna derecha */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* BottomNav — solo mobile */}
      <BottomNav />

      {/* PWA */}
      <UpdateNotification />
      <InstallPrompt />
    </div>
  );
}
