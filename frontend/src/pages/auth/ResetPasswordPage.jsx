import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../api/auth';

export default function ResetPasswordPage() {
  const [params]                    = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = params.get('token') || '';

  const [newPassword,  setNewPassword ] = useState('');
  const [confirm,      setConfirm     ] = useState('');
  const [showNew,      setShowNew     ] = useState(false);
  const [showConfirm,  setShowConfirm ] = useState(false);
  const [busy,         setBusy        ] = useState(false);
  const [error,        setError       ] = useState('');
  const [done,         setDone        ] = useState(false);

  useEffect(() => {
    if (!token) setError('El enlace es inválido. Solicita uno nuevo.');
  }, [token]);

  const strength = (() => {
    let s = 0;
    if (newPassword.length >= 8)          s++;
    if (/[A-Z]/.test(newPassword))        s++;
    if (/[0-9]/.test(newPassword))        s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][strength];
  const strengthColor = ['', 'bg-rose-500', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (newPassword.length < 8)  { setError('Mínimo 8 caracteres'); return; }

    setBusy(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace es inválido o ya expiró');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4 py-6 relative overflow-x-hidden">

      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />

      <div className="relative w-full max-w-md animate-fade-in my-auto">
        <div className="text-center mb-4 sm:mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-white/95 rounded-2xl sm:rounded-3xl shadow-float mb-2.5 sm:mb-4">
            <span className="text-3xl sm:text-5xl">🔑</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Nueva contraseña</h1>
          <p className="text-violet-200 mt-1 text-sm">Elige una contraseña segura</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-5 sm:p-8 animate-slide-up">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Contraseña actualizada!</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Redirigiendo al inicio de sesión en unos segundos…
              </p>
              <Link to="/login" className="inline-block mt-4 btn-primary text-sm px-6 py-2.5">
                Ir al login ahora
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">Crear nueva contraseña</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 sm:mb-6">
                Ingresa tu nueva contraseña. Asegúrate de que sea difícil de adivinar.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Nueva contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-base pl-11 pr-11"
                      placeholder="Mínimo 8 caracteres"
                      required
                      disabled={!token}
                    />
                    <button type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Barra de fuerza */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirmar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="input-base pl-11 pr-11"
                      placeholder="Repite la contraseña"
                      required
                      disabled={!token}
                    />
                    <button type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirm && newPassword && confirm !== newPassword && (
                    <p className="text-xs text-rose-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={busy || !token}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60">
                  {busy ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {busy ? 'Actualizando…' : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 mt-4 sm:mt-6 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
