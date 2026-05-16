import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acceptInvitation } from '../api/family';
import useAuthStore from '../store/authStore';

export default function JoinFamilyPage() {
  const { token }     = useParams();
  const navigate      = useNavigate();
  const { user, refreshUser } = useAuthStore();
  const isLoggedIn    = !!user;

  const [status,  setStatus ] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      sessionStorage.setItem('pendingFamilyToken', token);
      navigate(`/login?redirect=/family/join/${token}`);
      return;
    }

    acceptInvitation(token)
      .then(async () => {
        // Sincronizar plan desde el servidor para que el sidebar se actualice
        await refreshUser();
        setStatus('success');
        setMessage('¡Te has unido a la familia exitosamente!');
        setTimeout(() => navigate('/family'), 2500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'El enlace es inválido o ha expirado.');
      });
  }, [token, isLoggedIn, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Procesando invitación…</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Bienvenido!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
              <span>👨‍👩‍👧</span>
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Plan Familiar activado</span>
            </div>
            <p className="text-xs text-gray-400 mt-3">Redirigiendo al panel familiar…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No se pudo unir</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">{message}</p>
            <button onClick={() => navigate('/family')}
              className="btn-primary w-auto px-6 py-2.5 text-sm">
              Ir al panel familiar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
