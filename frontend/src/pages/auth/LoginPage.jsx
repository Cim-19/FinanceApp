import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { login } from '../../api/auth';
import useAuthStore from '../../store/authStore';

const FEATURES = [
  { icon: '📊', label: 'Reportes' },
  { icon: '🎯', label: 'Presupuestos' },
  { icon: '🐷', label: 'Ahorros' },
  { icon: '💳', label: 'Cuentas' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [form,         setForm        ] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading     ] = useState(false);
  const [error,        setError       ] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await login(form);
      setAuth(data.data.user, data.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Blobs decorativos */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse-slow" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" />

      <div className="relative w-full max-w-md animate-fade-in">

        {/* Marca */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/95 rounded-3xl shadow-float mb-4">
            <span className="text-5xl">🐷</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">FinanceApp</h1>
          <p className="text-purple-200 mt-1 text-sm">Tu dinero, bajo control 💜</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bienvenido de vuelta</h2>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-base pl-11"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-base pl-11 pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-1.5">
                <Link to="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Iniciar sesión</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-white text-xs font-medium">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
