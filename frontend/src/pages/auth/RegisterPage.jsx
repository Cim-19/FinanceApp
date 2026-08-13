import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { register } from '../../api/auth';
import useAuthStore from '../../store/authStore';

const passwordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)         score++;
  if (/[A-Z]/.test(pwd))       score++;
  if (/[0-9]/.test(pwd))       score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const STRENGTH_LABELS = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd,  setShowPwd ] = useState(false);
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState('');

  const strength  = passwordStrength(form.password);
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await register({ name: form.name, email: form.email, password: form.password });
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center p-4 py-4 sm:py-6 relative overflow-x-hidden">

      <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse-slow" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse-slow" />

      <div className="relative w-full max-w-md animate-fade-in my-auto">

        {/* Marca */}
        <div className="text-center mb-3 sm:mb-7">
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-20 sm:h-20 bg-white/95 rounded-2xl sm:rounded-3xl shadow-float mb-1.5 sm:mb-4">
            <span className="text-2xl sm:text-5xl">🚀</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">Crea tu cuenta</h1>
          <p className="text-emerald-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">¡Es gratis para siempre! 🎉</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-4 sm:p-8 animate-slide-up">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-6">Tus datos</h2>

          {error && (
            <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className="input-base pl-11" placeholder="Juan García" required minLength={2} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className="input-base pl-11" placeholder="tu@email.com" required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  className="input-base pl-11 pr-12" placeholder="Mínimo 8 caracteres" required minLength={8} />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Seguridad: <span className="font-medium">{STRENGTH_LABELS[strength]}</span></p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  className="input-base pl-11 pr-11" placeholder="Repite la contraseña" required />
                {form.confirm && form.confirm === form.password && (
                  <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Crear cuenta gratis</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
