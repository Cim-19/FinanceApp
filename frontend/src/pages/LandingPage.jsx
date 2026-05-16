import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronDown, Menu, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { emoji: '📊', title: 'Dashboard inteligente',    desc: 'Visualiza tu situación financiera de un vistazo con KPIs, gráficas y tendencias en tiempo real.' },
  { emoji: '💸', title: 'Control de gastos',        desc: 'Registra ingresos y egresos con categorías, etiquetas y notas. Filtra y busca en segundos.' },
  { emoji: '🎯', title: 'Presupuestos por categoría', desc: 'Define límites mensuales y recibe alertas visuales cuando te acerques al tope.' },
  { emoji: '📈', title: 'Reportes avanzados',       desc: 'Analiza tendencias mensuales, anuales y por categoría. Exporta a CSV con un clic.' },
  { emoji: '🔄', title: 'Transferencias',           desc: 'Mueve dinero entre tus cuentas de forma atómica, sin afectar tus reportes.' },
  { emoji: '📱', title: 'App instalable (PWA)',      desc: 'Instálala en tu Android o iPhone y úsala sin conexión. Siempre disponible.' },
];

const STEPS = [
  { n: '01', emoji: '🔐', title: 'Crea tu cuenta',           desc: 'Regístrate gratis en menos de 30 segundos. Sin tarjeta de crédito.' },
  { n: '02', emoji: '💳', title: 'Agrega tus cuentas',       desc: 'Conecta tu cuenta corriente, ahorros, tarjetas e inversiones.' },
  { n: '03', emoji: '🚀', title: 'Toma el control',          desc: 'Registra movimientos, define presupuestos y mira crecer tu ahorro.' },
];

const PLANS = [
  {
    key: 'FREE', name: 'Free', price: 'Gratis', sub: 'Para siempre',
    color: 'border-gray-200 dark:border-gray-700',
    badge: null,
    perks: ['2 cuentas', '50 transacciones/mes', 'Categorías del sistema', 'Dashboard y reportes básicos'],
    cta: 'Empezar gratis', ctaStyle: 'btn-secondary',
  },
  {
    key: 'PRO', name: 'Pro ⭐', price: 'S/. 4.99', sub: '/mes',
    color: 'border-violet-500 shadow-xl shadow-violet-100 dark:shadow-violet-900/30',
    badge: 'Más popular',
    perks: ['Cuentas ilimitadas', 'Transacciones ilimitadas', 'Categorías personalizadas', 'Exportar CSV', 'Importar CSV', 'Reportes avanzados'],
    cta: 'Empezar Pro', ctaStyle: 'btn-primary',
  },
  {
    key: 'FAMILY', name: 'Family 👨‍👩‍👧', price: 'S/. 8.99', sub: '/mes',
    color: 'border-amber-300 dark:border-amber-700',
    badge: null,
    perks: ['Todo lo de Pro', 'Hasta 5 miembros', 'Panel familiar compartido', 'Soporte prioritario'],
    cta: 'Empezar Family', ctaStyle: 'btn-secondary',
  },
];

const FAQS = [
  { q: '¿Es seguro guardar mis datos financieros?', a: 'Sí. Usamos JWT con tokens de corta duración, contraseñas hasheadas con bcrypt y HTTPS en todo momento. Tus datos nunca se comparten con terceros.' },
  { q: '¿Puedo usar FinanceApp en mi celular?', a: 'Absolutamente. Es una PWA (Progressive Web App) — instálala desde el navegador en Android o iOS y úsala como app nativa, incluso sin internet.' },
  { q: '¿Qué pasa si supero el límite del plan Free?', a: 'Te avisaremos antes de llegar al límite. Podrás seguir viendo tus datos existentes, pero necesitarás el plan Pro para registrar más transacciones.' },
  { q: '¿Cómo cancelo mi suscripción?', a: 'Desde Configuración → Suscripción puedes cancelar en cualquier momento. Mantendrás acceso Pro hasta el fin del período pagado.' },
  { q: '¿Mis datos están respaldados?', a: 'Sí. Usamos PostgreSQL en Railway con backups automáticos diarios. Además puedes exportar todas tus transacciones a CSV cuando quieras.' },
];

const STATS = [
  { n: '10+',   label: 'Categorías del sistema' },
  { n: '4',     label: 'Tipos de cuenta'        },
  { n: '100%',  label: 'Gratis para empezar'    },
  { n: 'PWA',   label: 'Instalable en móvil'    },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Navbar({ isAuth }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
            <span className="text-base">🐷</span>
          </div>
          <span className="font-extrabold text-gray-900 dark:text-white text-lg">FinanceApp</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {[['#features','Funciones'],['#pricing','Precios'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition">
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          {isAuth ? (
            <Link to="/dashboard" className="btn-primary gap-2 text-sm">
              🚀 Ir al dashboard
            </Link>
          ) : (
            <>
              <Link to="/login"    className="btn-secondary text-sm">Iniciar sesión</Link>
              <Link to="/register" className="btn-primary  text-sm">Empieza gratis</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen((o) => !o)}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
          {[['#features','Funciones'],['#pricing','Precios'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block text-sm text-gray-600 dark:text-gray-300 font-medium py-1">
              {label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            {isAuth ? (
              <Link to="/dashboard" className="btn-primary flex-1 text-sm text-center">🚀 Dashboard</Link>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary flex-1 text-sm text-center">Iniciar sesión</Link>
                <Link to="/register" className="btn-primary  flex-1 text-sm text-center">Empieza gratis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
        <span className="font-semibold text-gray-800 dark:text-white text-sm pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const isAuth = !!useAuthStore((s) => s.accessToken);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Navbar isAuth={isAuth} />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-violet-400/20 rounded-full blur-3xl" />
          <div className="absolute top-20 -right-32 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-pink-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 text-violet-700 dark:text-violet-300 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span>✨</span> Gestiona tus finanzas personales
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            Tus finanzas,{' '}
            <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
              bajo control
            </span>
          </h1>

          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Registra ingresos y gastos, define presupuestos, analiza reportes y toma decisiones inteligentes sobre tu dinero — todo en un solo lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link to="/register"
              className="btn-primary text-base px-8 py-3.5 gap-2 shadow-xl shadow-violet-200 dark:shadow-violet-900/30">
              🚀 Empieza gratis
            </Link>
            <a href="#features"
              className="btn-secondary text-base px-8 py-3.5">
              Ver funciones →
            </a>
          </div>

          {/* App preview card */}
          <div className="relative max-w-3xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-1 shadow-2xl shadow-violet-200/30 dark:shadow-violet-900/40">
              <div className="rounded-2xl bg-gray-950 p-6 text-left">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="flex-1 h-6 bg-gray-800 rounded-lg ml-2 flex items-center px-3">
                    <span className="text-gray-500 text-xs">financeapp.vercel.app/dashboard</span>
                  </div>
                </div>
                {/* Fake dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Saldo Total',  val: 'S/. 12,450', color: 'from-violet-500 to-purple-600'  },
                    { label: 'Ingresos',     val: 'S/. 4,200',  color: 'from-emerald-500 to-teal-600'   },
                    { label: 'Egresos',      val: 'S/. 1,830',  color: 'from-rose-500 to-pink-600'      },
                    { label: 'Neto',         val: 'S/. 2,370',  color: 'from-blue-500 to-indigo-600'    },
                  ].map((k) => (
                    <div key={k.label} className="bg-gray-800 rounded-xl p-3">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${k.color} mb-2`} />
                      <p className="text-white font-bold text-sm">{k.val}</p>
                      <p className="text-gray-400 text-xs">{k.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-gray-800 rounded-xl p-3 h-24 flex items-end gap-1">
                    {[40,65,45,80,55,90,70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm"
                        style={{ height: `${h}%`, background: i % 2 === 0 ? '#10b981' : '#f43f5e' }} />
                    ))}
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 h-24 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-4 border-violet-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">68%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent rounded-3xl pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold">{s.n}</p>
              <p className="text-violet-200 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Funciones</span>
          <h2 className="text-4xl font-extrabold mt-2 mb-4">Todo lo que necesitas</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Diseñado para personas que quieren tomar el control de sus finanzas sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-900/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {f.emoji}
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Cómo funciona</span>
            <h2 className="text-4xl font-extrabold mt-2 mb-4">Empieza en 3 pasos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700" />
                )}
                <div className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-white/60 text-xs font-bold -mt-1">{s.n}</span>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Precios</span>
          <h2 className="text-4xl font-extrabold mt-2 mb-4">Sin sorpresas</h2>
          <p className="text-gray-500 dark:text-gray-400">Empieza gratis, mejora cuando lo necesites.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((p) => (
            <div key={p.key}
              className={`relative rounded-3xl border-2 p-7 transition-all ${p.color}`}>
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
                  {p.badge}
                </div>
              )}
              <h3 className="font-extrabold text-xl text-gray-800 dark:text-white mb-1">{p.name}</h3>
              <div className="flex items-end gap-1 mb-5">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{p.price}</span>
                <span className="text-gray-400 pb-1">{p.sub}</span>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link to="/register"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  p.ctaStyle === 'btn-primary'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-violet-200 dark:shadow-violet-900/30'
                    : 'border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-widest">FAQ</span>
            <h2 className="text-4xl font-extrabold mt-2">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-12 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <span className="text-5xl block mb-4">🐷</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Empieza a ahorrar hoy
            </h2>
            <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
              Únete y toma el control de tus finanzas personales. Gratis, para siempre.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-violet-700 font-bold px-8 py-4 rounded-2xl hover:bg-violet-50 transition text-base shadow-xl">
              🚀 Crear cuenta gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🐷</span>
              </div>
              <span className="font-bold text-gray-700 dark:text-gray-200">FinanceApp</span>
            </div>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} FinanceApp. Hecho con ❤️ en Perú.</p>
            <div className="flex items-center gap-4">
              <Link to="/login"    className="text-sm text-gray-400 hover:text-violet-600 transition">Iniciar sesión</Link>
              <Link to="/register" className="text-sm text-gray-400 hover:text-violet-600 transition">Registrarse</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
