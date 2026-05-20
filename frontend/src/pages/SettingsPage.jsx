import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Lock, Star, Upload, CheckCircle, AlertCircle, Eye, EyeOff, Zap } from 'lucide-react';
import { getProfile, updateProfile, changePassword, importCsv } from '../api/users';
import { formatDateTimeLima } from '../utils/formatDate';
import { getPublicConfig } from '../api/config';
import { createCharge }    from '../api/payments';
import useAuthStore from '../store/authStore';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines  = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
  }).filter((r) => r.fecha || r.date);
}

const COL_MAP = { fecha: 'date', tipo: 'type', monto: 'amount', descripcion: 'description', descripción: 'description', cuenta: 'account', categoría: 'category', categoria: 'category' };

function normalizeRow(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const mapped = COL_MAP[k.toLowerCase()] || k.toLowerCase();
    out[mapped] = v;
  }
  return out;
}

const PLAN_META = {
  FREE:   { label: 'Free',   color: 'text-gray-600   dark:text-gray-300',   bg: 'bg-gray-100   dark:bg-gray-800',   emoji: '🆓' },
  PRO:    { label: 'Pro',    color: 'text-violet-600 dark:text-violet-300',  bg: 'bg-violet-100 dark:bg-violet-900/30', emoji: '⭐' },
  FAMILY: { label: 'Family', color: 'text-amber-600  dark:text-amber-300',   bg: 'bg-amber-100  dark:bg-amber-900/30',  emoji: '👨‍👩‍👧' },
};

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, subtitle, gradient, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium mt-3 px-3 py-2 rounded-xl ${
      ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
         : 'bg-rose-50    dark:bg-rose-900/20    text-rose-700    dark:text-rose-300'
    }`}>
      {ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection({ profile }) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [name,     setName    ] = useState(profile?.name     || '');
  const [currency, setCurrency] = useState(profile?.currency || 'PEN');
  const [busy,     setBusy    ] = useState(false);
  const [toast,    setToast   ] = useState(null);

  useEffect(() => {
    if (profile) { setName(profile.name); setCurrency(profile.currency); }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true); setToast(null);
    try {
      const { data } = await updateProfile({ name: name.trim(), currency });
      updateUser(data.data);
      setToast({ msg: 'Perfil actualizado correctamente', ok: true });
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Error al guardar', ok: false });
    } finally {
      setBusy(false);
    }
  };

  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <Section icon={User} title="Perfil" subtitle="Tu nombre y preferencias de cuenta"
      gradient="from-violet-500 to-purple-600">

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-white text-lg">{name || '—'}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
            Miembro desde {profile?.createdAt ? formatDateTimeLima(profile.createdAt) : '—'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre completo</label>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre" minLength={2} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <input className="input-base opacity-60 cursor-not-allowed" value={profile?.email || ''} readOnly
            title="El email no se puede cambiar por ahora" />
          <p className="text-xs text-gray-400 mt-1">El email no se puede modificar desde aquí.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Moneda</label>
          <div className="flex gap-2">
            {[
              { val: 'PEN', label: '🇵🇪 Sol (S/.)' },
              { val: 'USD', label: '🇺🇸 Dólar ($)' },
            ].map((opt) => (
              <button key={opt.val} type="button"
                onClick={() => setCurrency(opt.val)}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                  currency === opt.val
                    ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>

        <Toast msg={toast?.msg} ok={toast?.ok} />
      </form>
    </Section>
  );
}

// ── Password section ──────────────────────────────────────────────────────────

function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState({ curr: false, new: false });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const strength = (() => {
    const p = form.newPassword;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][strength];
  const strengthColor = ['', 'bg-rose-500', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    if (form.newPassword !== form.confirm) {
      setToast({ msg: 'Las contraseñas no coinciden', ok: false }); return;
    }
    if (form.newPassword.length < 8) {
      setToast({ msg: 'La nueva contraseña debe tener al menos 8 caracteres', ok: false }); return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setToast({ msg: 'Contraseña actualizada correctamente', ok: true });
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Error al cambiar contraseña', ok: false });
    } finally {
      setBusy(false);
    }
  };

  const PasswordInput = ({ label, field, showKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="input-base pr-10"
          value={form[field]}
          onChange={(e) => set(field, e.target.value)}
          required
        />
        <button type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
          {show[showKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <Section icon={Lock} title="Contraseña" subtitle="Cambia tu contraseña de acceso"
      gradient="from-rose-500 to-pink-600">
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput label="Contraseña actual" field="currentPassword" showKey="curr" />
        <PasswordInput label="Nueva contraseña"  field="newPassword"     showKey="new"  />

        {form.newPassword && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4].map((i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">{strengthLabel}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar contraseña</label>
          <input
            type="password" className="input-base"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>

        <Toast msg={toast?.msg} ok={toast?.ok} />
      </form>
    </Section>
  );
}

// ── Subscription section ──────────────────────────────────────────────────────

function SubscriptionSection({ profile, onPlanChange }) {
  const plan = profile?.subscription?.plan || 'FREE';
  const meta = PLAN_META[plan] || PLAN_META.FREE;

  const [publicConfig, setPublicConfig] = useState({});
  const [paying,       setPaying      ] = useState(null); // plan key being paid
  const [toast,        setToast       ] = useState({ msg: '', ok: true });

  useEffect(() => {
    getPublicConfig().then((r) => setPublicConfig(r.data.data)).catch(() => {});
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 4000);
  };

  const loadCulqi = () =>
    new Promise((resolve) => {
      if (window.Culqi) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.culqi.com/js/v4';
      s.onload = resolve;
      document.head.appendChild(s);
    });

  const handleUpgrade = async (targetPlan) => {
    const publicKey = publicConfig.culqi_public_key;
    if (!publicKey) {
      showToast('Los pagos aún no están configurados. Contacta al administrador.', false);
      return;
    }

    const rawPrice = targetPlan === 'PRO' ? publicConfig.price_pro : publicConfig.price_family;
    const amount   = parseInt(rawPrice || '0', 10);
    if (!amount) {
      showToast('Precio no configurado. Contacta al administrador.', false);
      return;
    }

    await loadCulqi();

    window.Culqi.publicKey = publicKey;
    window.Culqi.settings({
      title:    'FinanceApp',
      currency: 'PEN',
      amount,
      order:    `plan-${targetPlan.toLowerCase()}-${Date.now()}`,
    });
    window.Culqi.options({ style: { logo: '' } });

    window.culqi = async () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        window.Culqi.close();
        setPaying(targetPlan);
        try {
          const res = await createCharge({ token, plan: targetPlan });
          showToast(res.data.message || 'Plan actualizado correctamente');
          onPlanChange?.();
        } catch (err) {
          showToast(err.response?.data?.error || 'Error al procesar el pago', false);
        } finally {
          setPaying(null);
        }
      } else if (window.Culqi.error) {
        showToast(window.Culqi.error.user_message || 'Error en el pago', false);
      }
    };

    window.Culqi.open();
  };

  const PLANS = [
    {
      key: 'FREE', emoji: '🆓', name: 'Free', price: 'Gratis',
      perks: ['2 cuentas', '50 transacciones/mes', 'Reportes básicos'],
    },
    {
      key: 'PRO', emoji: '⭐', name: 'Pro',
      price: publicConfig.price_pro ? `S/. ${(publicConfig.price_pro / 100).toFixed(2)}/mes` : 'S/. 4.99/mes',
      perks: ['Cuentas ilimitadas', 'Transacciones ilimitadas', 'Exportar CSV', 'Reportes avanzados'],
    },
    {
      key: 'FAMILY', emoji: '👨‍👩‍👧', name: 'Family',
      price: publicConfig.price_family ? `S/. ${(publicConfig.price_family / 100).toFixed(2)}/mes` : 'S/. 8.99/mes',
      perks: ['Todo lo de Pro', 'Hasta 5 usuarios', 'Panel familiar'],
    },
  ];

  return (
    <Section icon={Star} title="Suscripción" subtitle="Tu plan actual y opciones de mejora"
      gradient="from-amber-400 to-orange-500">

      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-5 ${meta.bg}`}>
        <span className="text-2xl">{meta.emoji}</span>
        <div>
          <p className={`font-bold ${meta.color}`}>Plan {meta.label}</p>
          <p className="text-xs text-gray-400">
            {profile?.subscription?.status === 'ACTIVE' ? 'Activo' : 'Sin suscripción'}
          </p>
        </div>
        {plan === 'FREE' && (
          <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold px-2 py-1 rounded-lg">
            Mejora tu plan
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((p) => (
          <div key={p.key}
            className={`rounded-2xl border-2 p-4 transition-all ${
              plan === p.key
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{p.emoji}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.price}</p>
              </div>
              {plan === p.key && (
                <span className="ml-auto text-[10px] font-bold bg-violet-500 text-white px-2 py-0.5 rounded-full">Actual</span>
              )}
            </div>
            <ul className="space-y-1 mb-3">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
            {plan !== p.key && p.key !== 'FREE' && (
              <button
                onClick={() => handleUpgrade(p.key)}
                disabled={!!paying}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-1.5">
                {paying === p.key
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Zap className="w-3 h-3" />}
                {paying === p.key ? 'Procesando…' : 'Seleccionar'}
              </button>
            )}
          </div>
        ))}
      </div>

      <Toast msg={toast.msg} ok={toast.ok} />
    </Section>
  );
}

// ── Import CSV section ────────────────────────────────────────────────────────

function ImportSection() {
  const fileRef  = useRef(null);
  const [rows,    setRows   ] = useState([]);
  const [dragging,setDragging] = useState(false);
  const [busy,    setBusy   ] = useState(false);
  const [result,  setResult ] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCsv(e.target.result).map(normalizeRow);
      setRows(parsed.slice(0, 200));
    };
    reader.readAsText(file, 'utf-8');
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await importCsv(rows);
      setResult(data.data);
      if (data.data.imported > 0) setRows([]);
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Error al importar' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section icon={Upload} title="Importar CSV" subtitle="Carga transacciones desde un archivo CSV"
      gradient="from-emerald-500 to-teal-600">

      {/* Format hint */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4 text-xs font-mono text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1 not-italic font-sans">Formato esperado (encabezados en español o inglés):</p>
        <p>Fecha,Tipo,Monto,Descripcion,Categoria,Cuenta</p>
        <p>2026-05-01,EGRESO,45.50,Almuerzo,Alimentación,Mi cuenta</p>
        <p>2026-05-02,INGRESO,2500,Salario,,Mi cuenta</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
        }`}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => handleFile(e.target.files[0])} />
        <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Arrastra tu archivo CSV aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400 mt-1">Máximo 200 filas por importación</p>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {rows.length} filas detectadas
            </p>
            <button onClick={() => { setRows([]); setResult(null); }}
              className="text-xs text-gray-400 hover:text-rose-500 transition">Limpiar</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  {['date','type','amount','description','category','account'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 capitalize">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {['date','type','amount','description','category','account'].map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{r[h] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-center text-xs text-gray-400 py-2">… y {rows.length - 5} filas más</p>
            )}
          </div>

          <button onClick={handleImport} disabled={busy}
            className="btn-primary w-full mt-3 gap-2 disabled:opacity-50">
            {busy ? 'Importando…' : `Importar ${rows.length} transacciones`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl border text-sm ${
          result.error
            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        }`}>
          {result.error ? (
            <p>❌ {result.error}</p>
          ) : (
            <>
              <p className="font-bold mb-1">✅ {result.imported} transacciones importadas de {result.total}</p>
              {result.errors?.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-amber-600 dark:text-amber-400">
                    {result.errors.length} filas con errores (ver detalles)
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-xs text-gray-500">• {e.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(() => {
    getProfile().then(({ data }) => setProfile(data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Configuración</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administra tu cuenta y preferencias</p>
      </div>

      <ProfileSection      profile={profile} />
      <PasswordSection />
      <SubscriptionSection profile={profile} onPlanChange={fetchProfile} />
      <ImportSection />
    </div>
  );
}
