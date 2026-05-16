import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '../../api/auth';

export default function ForgotPasswordPage() {
  const [email,   setEmail  ] = useState('');
  const [sent,    setSent   ] = useState(false);
  const [busy,    setBusy   ] = useState(false);
  const [error,   setError  ] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el correo. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/95 rounded-3xl shadow-float mb-4">
            <span className="text-5xl">🔐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Recuperar acceso</h1>
          <p className="text-orange-100 mt-1 text-sm">Te enviamos un link de recuperación</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 animate-slide-up">
          {!sent ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Olvidaste tu contraseña?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Ingresa tu email y te enviaremos las instrucciones para recuperarla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="input-base pl-11" placeholder="tu@email.com" required />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={busy}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60">
                  {busy ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {busy ? 'Enviando…' : 'Enviar instrucciones'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¡Revisa tu correo!</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                Si <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span> está registrado,
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                recibirás un enlace válido por <strong>1 hora</strong>.
              </p>
              <p className="text-xs text-gray-400 mt-4">¿No llegó? Revisa tu carpeta de spam.</p>
            </div>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
