import { useState, useEffect } from 'react';
import { Settings, Key, DollarSign, Eye, EyeOff, Save, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { getAdminConfig, setAdminConfig } from '../../api/config';
import api from '../../api/axios';

function Section({ icon: Icon, title, subtitle, gradient, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
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
    <div className={`flex items-center gap-2 text-sm font-medium mt-4 px-3 py-2.5 rounded-xl ${
      ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
         : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
    }`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

function MaskedInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 pr-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
      />
      <button type="button" onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AdminConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [toast,   setToast  ] = useState({ msg: '', ok: true });

  const [culqi, setCulqi] = useState({ public_key: '', private_key: '' });
  const [prices, setPrices] = useState({ pro: '', family: '' });

  useEffect(() => {
    getAdminConfig()
      .then((res) => {
        const d = res.data.data;
        setCulqi({ public_key: d.culqi_public_key || '', private_key: d.culqi_private_key || '' });
        setPrices({
          pro:    d.price_pro    ? String(Number(d.price_pro)    / 100) : '4.99',
          family: d.price_family ? String(Number(d.price_family) / 100) : '8.99',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: '', ok: true }), 3500);
  };

  const saveCulqi = async () => {
    setSaving(true);
    try {
      await setAdminConfig({
        culqi_public_key:  culqi.public_key,
        culqi_private_key: culqi.private_key,
      });
      showToast('Llaves de Culqi guardadas correctamente');
    } catch {
      showToast('Error al guardar las llaves', false);
    } finally {
      setSaving(false);
    }
  };

  const savePrices = async () => {
    const price_pro    = Math.round(parseFloat(prices.pro)    * 100);
    const price_family = Math.round(parseFloat(prices.family) * 100);
    if (!price_pro || !price_family || price_pro <= 0 || price_family <= 0) {
      showToast('Los precios deben ser mayores a 0', false);
      return;
    }
    setSaving(true);
    try {
      await setAdminConfig({ price_pro: String(price_pro), price_family: String(price_family) });
      showToast('Precios actualizados correctamente');
    } catch {
      showToast('Error al guardar los precios', false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración del sistema</h1>
        <p className="text-gray-400 text-sm mt-1">Administra las llaves de pago y precios de los planes</p>
      </div>

      {/* Culqi Keys */}
      <Section icon={Key} title="Llaves de Culqi" subtitle="Obtén tus llaves en panel.culqi.com" gradient="from-violet-500 to-purple-600">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Llave pública <span className="text-xs text-gray-400 font-normal">(pk_test_... o pk_live_...)</span>
            </label>
            <input
              type="text"
              value={culqi.public_key}
              onChange={(e) => setCulqi((c) => ({ ...c, public_key: e.target.value }))}
              placeholder="pk_test_xxxxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Llave privada <span className="text-xs text-gray-400 font-normal">(sk_test_... o sk_live_...)</span>
            </label>
            <MaskedInput
              value={culqi.private_key}
              onChange={(v) => setCulqi((c) => ({ ...c, private_key: v }))}
              placeholder="sk_test_xxxxxxxxxxxx"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            💡 Usa llaves de <strong>sandbox</strong> (pk_test_ / sk_test_) para probar sin cobros reales.
            Cambia a llaves de <strong>producción</strong> (pk_live_ / sk_live_) cuando estés listo para cobrar.
          </div>

          <button onClick={saveCulqi} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar llaves
          </button>
        </div>
      </Section>

      {/* Precios */}
      <Section icon={DollarSign} title="Precios de los planes" subtitle="Monto en soles (S/.)" gradient="from-emerald-500 to-teal-600">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Plan Pro (S/. / mes)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">S/.</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={prices.pro}
                  onChange={(e) => setPrices((p) => ({ ...p, pro: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Plan Family (S/. / mes)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">S/.</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={prices.family}
                  onChange={(e) => setPrices((p) => ({ ...p, family: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <button onClick={savePrices} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar precios
          </button>
        </div>
      </Section>

      {/* Test Notificaciones */}
      <TestNotificationSection onToast={showToast} />

      <Toast msg={toast.msg} ok={toast.ok} />
    </div>
  );
}

function TestNotificationSection({ onToast }) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await api.post('/admin/test-notification');
      onToast('Notificación de prueba enviada — revisa la campanita 🔔');
    } catch {
      onToast('Error al enviar la notificación', false);
    } finally {
      setSending(false);
    }
  };

  return (
    <Section icon={Bell} title="Notificaciones de prueba" subtitle="Genera una notificación aleatoria para verificar el sistema" gradient="from-indigo-500 to-violet-600">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Crea una notificación de prueba en tu cuenta para verificar que el sistema funciona correctamente.
        El tipo se elige al azar entre: presupuesto al 80%, presupuesto superado, transacción recurrente, suscripción por vencer y bienvenida.
      </p>
      <button onClick={send} disabled={sending}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60">
        {sending
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Bell className="w-4 h-4" />}
        {sending ? 'Enviando…' : 'Enviar notificación de prueba'}
      </button>
    </Section>
  );
}
