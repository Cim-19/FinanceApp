import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Plus, Mail, Trash2, LogOut, Crown, RefreshCw, UserCheck,
  Clock, TrendingUp, TrendingDown, Wallet, Target, PiggyBank, Edit2,
  Check, X,
} from 'lucide-react';
import useFamily        from '../hooks/useFamily';
import useAuthStore     from '../store/authStore';
import { acceptInvitation } from '../api/family';
import { getCategories }    from '../api/categories';
import { getAccounts }      from '../api/accounts';
import { formatCurrency }   from '../utils/formatCurrency';

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHART_COLORS = ['#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6'];

const ROLE_BADGE = {
  ADMIN:  'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  MEMBER: 'bg-gray-100  dark:bg-gray-700        text-gray-600  dark:text-gray-300',
};

const THIS_MONTH = new Date().getMonth() + 1;
const THIS_YEAR  = new Date().getFullYear();

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function pct(val, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((val / total) * 100));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MemberCard({ member, isMe, isAdmin, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">{initials(member.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{member.name}</p>
          {member.role === 'ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
          {isMe && <span className="text-[10px] text-gray-400">(tú)</span>}
        </div>
        <p className="text-xs text-gray-400 truncate">{member.email || member.user?.email}</p>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_BADGE[member.role]}`}>
        {member.role === 'ADMIN' ? 'Admin' : 'Miembro'}
      </span>
      {isAdmin && !isMe && member.role !== 'ADMIN' && (
        <button onClick={() => onRemove(member.userId || member.user?.id)}
          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition flex-shrink-0"
          title="Eliminar miembro">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function InvitationRow({ invite, onCancel }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
      <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{invite.email}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">Pendiente de aceptar · expira en 7 días</p>
      </div>
      <button onClick={() => onCancel(invite.id)}
        className="text-xs text-gray-400 hover:text-rose-500 transition px-2 py-1 rounded-lg">
        Cancelar
      </button>
    </div>
  );
}

// ── Dashboard Panel ───────────────────────────────────────────────────────────

function DashboardPanel({ dashboard }) {
  if (!dashboard) return (
    <div className="text-center py-12 text-gray-400">
      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
      <p className="text-sm">Cargando dashboard familiar…</p>
    </div>
  );

  const { consolidated, members } = dashboard;

  // Datos para el gráfico de barras por miembro
  const barData = members.map((m) => ({
    name:    m.name.split(' ')[0],
    Ingresos: m.income,
    Egresos:  m.expense,
  }));

  // Categorías agregadas de todos los miembros
  const categoryMap = {};
  members.forEach((m) => {
    (m.topCategories || []).forEach((c) => {
      if (!c?.id) return;
      if (!categoryMap[c.id]) categoryMap[c.id] = { name: c.name, icon: c.icon, color: c.color, amount: 0 };
      categoryMap[c.id].amount += c.amount;
    });
  });
  const allCategories = Object.values(categoryMap).sort((a, b) => b.amount - a.amount).slice(0, 6);

  const pieData = allCategories.map((c) => ({ name: c.name, value: c.amount }));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Balance total', value: consolidated.totalBalance, icon: <Wallet className="w-4 h-4" />,       color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'Ingresos mes',  value: consolidated.income,       icon: <TrendingUp className="w-4 h-4" />,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Egresos mes',   value: consolidated.expense,      icon: <TrendingDown className="w-4 h-4" />, color: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Neto mes',      value: consolidated.net,
            icon: <span className="text-base">⚖️</span>,
            color: consolidated.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} rounded-2xl p-4`}>
            <div className={`${k.color} mb-1`}>{k.icon}</div>
            <p className={`text-lg font-extrabold ${k.color}`}>{formatCurrency(k.value)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfico: Ingresos vs Egresos por miembro */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">Ingresos vs Egresos por miembro — este mes</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Bar dataKey="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="Egresos"  fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gastos por categoría familiar */}
      {allCategories.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Pie */}
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Distribución de gastos</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top categorías lista */}
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Top categorías de gasto</h3>
            <div className="space-y-3">
              {allCategories.map((c, i) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{c.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">{formatCurrency(c.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct(c.amount, allCategories[0].amount)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desglose por miembro */}
      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-500" /> Detalle por miembro
        </h3>
        <div className="space-y-4">
          {members.map((m) => (
            <div key={m.userId}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{initials(m.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{m.name}</p>
                    {m.role === 'ADMIN' && <Crown className="w-3 h-3 text-amber-500" />}
                  </div>
                  <p className="text-xs text-gray-400">{formatCurrency(m.totalBalance)} en cuentas</p>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">+{formatCurrency(m.income)}</p>
                  <p className="text-xs text-rose-600 dark:text-rose-400">-{formatCurrency(m.expense)}</p>
                  <p className={`text-xs font-bold ${m.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                  </p>
                </div>
              </div>
              {(m.topCategories || []).length > 0 && (
                <div className="ml-11 flex flex-wrap gap-1.5">
                  {m.topCategories.slice(0, 4).map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {c.name} · {formatCurrency(c.amount)}
                    </span>
                  ))}
                </div>
              )}
              {m !== members[members.length - 1] && <div className="border-b border-gray-100 dark:border-gray-800 mt-4" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Budgets Panel ─────────────────────────────────────────────────────────────

function BudgetsPanel({ dashboard, isAdmin, saveBudget, removeBudget }) {
  const [showForm,   setShowForm  ] = useState(false);
  const [catId,      setCatId     ] = useState('');
  const [amount,     setAmount    ] = useState('');
  const [month,      setMonth     ] = useState(THIS_MONTH);
  const [year,       setYear      ] = useState(THIS_YEAR);
  const [busy,       setBusy      ] = useState(false);
  const [msg,        setMsg       ] = useState('');
  const [categories, setCategories] = useState([]);

  const budgets = dashboard?.budgets ?? [];

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const availableCategories = categories.filter((c) => c.type === 'EGRESO' || c.type === 'AMBOS');

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!catId || !amount) return;
    setBusy(true);
    try {
      await saveBudget({ categoryId: catId, amount: Number(amount), month: Number(month), year: Number(year) });
      setCatId(''); setAmount(''); setShowForm(false);
      flash('Presupuesto guardado');
    } catch (err) { flash(err.response?.data?.error || 'Error'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    try { await removeBudget(id); flash('Presupuesto eliminado'); }
    catch (err) { flash(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-center text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">{msg}</p>}

      {/* Lista de presupuestos */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-500" /> Presupuestos familiares
          </h3>
          {isAdmin && (
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          )}
        </div>

        {/* Formulario */}
        {showForm && isAdmin && (
          <form onSubmit={handleSave} className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Mes</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} className="input text-sm py-2">
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Año</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="input text-sm py-2">
                  {[THIS_YEAR - 1, THIS_YEAR, THIS_YEAR + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Categoría</label>
              {availableCategories.length > 0 ? (
                <select value={catId} onChange={(e) => setCatId(e.target.value)} className="input text-sm py-2" required>
                  <option value="">Seleccionar categoría…</option>
                  {availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <input value={catId} onChange={(e) => setCatId(e.target.value)}
                  placeholder="ID de categoría" className="input text-sm py-2" required />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Monto límite</label>
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" className="input text-sm py-2" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary w-auto px-4 py-2 text-sm flex-1">
                <Check className="w-3.5 h-3.5" /> Guardar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay presupuestos familiares para este mes.</p>
            {isAdmin && <p className="text-xs mt-1">Crea uno para controlar el gasto familiar por categoría.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((b) => {
              const p = pct(b.spent, b.amount);
              const over = b.spent > b.amount;
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{b.category?.name || '—'}</span>
                      <span className="text-[10px] text-gray-400">{MONTHS[(b.month ?? 1) - 1]} {b.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${over ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)}
                      </span>
                      {isAdmin && (
                        <button onClick={() => handleDelete(b.id)} className="p-1 text-gray-300 hover:text-rose-500 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : p > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>{p}% usado</span>
                    {over
                      ? <span className="text-rose-500">Excedido por {formatCurrency(b.spent - b.amount)}</span>
                      : <span>Disponible: {formatCurrency(b.amount - b.spent)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Goals Panel ───────────────────────────────────────────────────────────────

function GoalsPanel({ dashboard, isAdmin, addGoal, editGoal, removeGoal, contributeGoal }) {
  const [showForm,       setShowForm      ] = useState(false);
  const [editId,         setEditId        ] = useState(null);
  const [aportId,        setAportId       ] = useState(null);
  const [aportAmt,       setAportAmt      ] = useState('');
  const [aportAccId,     setAportAccId    ] = useState('');
  const [aportWithTx,    setAportWithTx   ] = useState(false);
  const [form,           setForm          ] = useState({ name: '', targetAmount: '', deadline: '', emoji: '🎯' });
  const [accounts,       setAccounts      ] = useState([]);
  const [busy,           setBusy          ] = useState(false);
  const [msg,            setMsg           ] = useState('');

  const goals = dashboard?.goals ?? [];

  useEffect(() => {
    getAccounts().then((r) => setAccounts(r.data.data || [])).catch(() => {});
  }, []);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };
  const resetForm = () => { setForm({ name: '', targetAmount: '', deadline: '', emoji: '🎯' }); setEditId(null); setShowForm(false); };
  const resetAport = () => { setAportId(null); setAportAmt(''); setAportAccId(''); setAportWithTx(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editId) {
        await editGoal(editId, { name: form.name, targetAmount: Number(form.targetAmount), deadline: form.deadline || null, emoji: form.emoji });
        flash('Meta actualizada');
      } else {
        await addGoal({ name: form.name, targetAmount: Number(form.targetAmount), deadline: form.deadline || null, emoji: form.emoji });
        flash('¡Meta creada! Todos los miembros ya pueden verla.');
      }
      resetForm();
    } catch (err) { flash(err.response?.data?.error || 'Error'); }
    finally { setBusy(false); }
  };

  const handleAport = async (goal) => {
    const val = Number(aportAmt);
    if (!val || val <= 0) return;
    if (aportWithTx && !aportAccId) { flash('Selecciona una cuenta para descontar el aporte.'); return; }
    setBusy(true);
    try {
      const result = await contributeGoal(goal.id, {
        amount:            val,
        accountId:         aportWithTx ? aportAccId : undefined,
        createTransaction: aportWithTx,
      });
      resetAport();
      flash(result.message || 'Aporte registrado');
    } catch (err) { flash(err.response?.data?.error || 'Error al registrar el aporte'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    try { await removeGoal(id); flash('Meta eliminada'); }
    catch (err) { flash(err.response?.data?.error || 'Error'); }
  };

  const EMOJIS = ['🎯','🏖️','🏠','🚗','🎓','💍','✈️','💻','🎸','🏋️','🐾','🛒'];

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm text-center text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">{msg}</p>}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-violet-500" /> Metas de ahorro familiares
          </h3>
          {isAdmin && !showForm && !editId && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium transition">
              <Plus className="w-4 h-4" /> Nueva meta
            </button>
          )}
        </div>

        {/* Formulario crear / editar */}
        {(showForm || editId) && isAdmin && (
          <form onSubmit={handleSave} className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                    className={`w-8 h-8 text-lg rounded-lg transition ${form.emoji === e ? 'bg-violet-200 dark:bg-violet-800 ring-2 ring-violet-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Nombre</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Vacaciones a la playa" className="input text-sm py-2" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Monto objetivo</label>
                <input type="number" min="1" step="0.01" value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="0.00" className="input text-sm py-2" required />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Fecha límite (opcional)</label>
                <input type="date" value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="input text-sm py-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary w-auto px-4 py-2 text-sm flex-1">
                <Check className="w-3.5 h-3.5" /> {editId ? 'Actualizar' : 'Crear meta'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay metas de ahorro familiares.</p>
            {isAdmin && <p className="text-xs mt-1">Crea una meta para que toda la familia trabaje hacia un objetivo en común.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((g) => {
              const p        = pct(g.currentAmount, g.targetAmount);
              const done     = g.currentAmount >= g.targetAmount;
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
              return (
                <div key={g.id} className="space-y-2">
                  {/* Cabecera de la meta */}
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{g.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">{g.name}</p>
                        {done && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                            ¡Completada!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {formatCurrency(g.currentAmount)} <span className="text-gray-400">de</span> {formatCurrency(g.targetAmount)}
                        </span>
                        {daysLeft !== null && (
                          <span className={daysLeft < 30 && !done ? 'text-amber-500 font-medium' : ''}>
                            {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencida'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setForm({ name: g.name, targetAmount: String(g.targetAmount), deadline: g.deadline ? g.deadline.slice(0,10) : '', emoji: g.emoji }); setEditId(g.id); setShowForm(false); }}
                          className="p-1.5 text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(g.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>{p}% completado</span>
                    {!done && <span>Faltan {formatCurrency(g.targetAmount - g.currentAmount)}</span>}
                  </div>

                  {/* Formulario de aporte */}
                  {!done && (
                    aportId === g.id ? (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-3">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Registrar aporte a esta meta</p>

                        <input type="number" min="0.01" step="0.01" value={aportAmt}
                          onChange={(e) => setAportAmt(e.target.value)}
                          placeholder="Monto del aporte" className="input text-sm py-2" autoFocus />

                        {/* Toggle: crear transacción real */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <div className="relative">
                            <input type="checkbox" className="sr-only" checked={aportWithTx}
                              onChange={(e) => { setAportWithTx(e.target.checked); if (!e.target.checked) setAportAccId(''); }} />
                            <div className={`w-9 h-5 rounded-full transition ${aportWithTx ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${aportWithTx ? 'translate-x-4' : ''}`} />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">Descontar de una cuenta (crea una transacción de egreso)</span>
                        </label>

                        {aportWithTx && (
                          <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Cuenta a descontar</label>
                            <select value={aportAccId} onChange={(e) => setAportAccId(e.target.value)}
                              className="input text-sm py-2" required={aportWithTx}>
                              <option value="">Seleccionar cuenta…</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} — {formatCurrency(Number(a.balance))}
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Se creará un egreso etiquetado como «meta-familiar» en tus transacciones.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => handleAport(g)} disabled={busy || !aportAmt}
                            className="btn-primary w-auto px-4 py-2 text-sm flex-1 flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Aportar
                          </button>
                          <button onClick={resetAport}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAportId(g.id)}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Registrar aporte
                      </button>
                    )
                  )}

                  <div className="border-b border-gray-100 dark:border-gray-800 pt-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FamilyPage() {
  const { user, refreshUser } = useAuthStore();
  const {
    family, dashboard, loading, error, fetch,
    create, update, destroy, invite, cancelInvite, removeMemberById, leave,
    saveBudget, removeBudget, addGoal, editGoal, removeGoal, contributeGoal,
  } = useFamily();

  const [tab,         setTab        ] = useState('members');
  const [familyName,  setFamilyName ] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [editName,    setEditName   ] = useState('');
  const [editing,     setEditing    ] = useState(false);
  const [busy,        setBusy       ] = useState(false);
  const [msg,         setMsg        ] = useState('');
  const [joinToken,   setJoinToken  ] = useState('');

  const isAdmin     = family?.adminId === user?.id;
  const memberCount = family?.members?.length ?? 0;

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setBusy(true);
    try {
      await create(familyName.trim());
      await refreshUser(); // sincronizar plan FAMILY desde el servidor
      setFamilyName('');
      flash('¡Familia creada exitosamente!');
    } catch (err) { flash(err.response?.data?.error || 'Error al crear la familia'); }
    finally { setBusy(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(true);
    try {
      await invite(inviteEmail.trim());
      setInviteEmail('');
      flash('Invitación enviada correctamente');
    } catch (err) { flash(err.response?.data?.error || 'Error al enviar invitación'); }
    finally { setBusy(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await update(editName.trim());
      setEditing(false);
      flash('Nombre actualizado');
    } catch (err) { flash(err.response?.data?.error || 'Error al actualizar'); }
    finally { setBusy(false); }
  };

  const handleRemove = async (memberId) => {
    if (!confirm('¿Eliminar este miembro de la familia?')) return;
    try { await removeMemberById(memberId); flash('Miembro eliminado'); }
    catch (err) { flash(err.response?.data?.error || 'Error al eliminar'); }
  };

  const handleLeave = async () => {
    if (!confirm('¿Abandonar la familia? Perderás acceso al panel familiar.')) return;
    try {
      await leave();
      await refreshUser(); // sincronizar plan FREE desde el servidor
    } catch (err) { flash(err.response?.data?.error || 'Error'); }
  };

  const handleDestroy = async () => {
    if (!confirm('¿Eliminar la familia? Esta acción no se puede deshacer.')) return;
    try {
      await destroy();
      await refreshUser(); // sincronizar plan FREE desde el servidor
    } catch (err) { flash(err.response?.data?.error || 'Error'); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinToken.trim()) return;
    setBusy(true);
    try {
      await acceptInvitation(joinToken.trim());
      await refreshUser(); // sincronizar plan FAMILY desde el servidor
      await fetch();
      flash('¡Te has unido a la familia!');
      setJoinToken('');
    } catch (err) { flash(err.response?.data?.error || 'Token inválido o expirado'); }
    finally { setBusy(false); }
  };

  if (loading) return <FamilySkeleton />;

  // ── Sin familia ───────────────────────────────────────────────────────────
  if (!family) {
    return (
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Panel Familiar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestiona las finanzas de tu familia en conjunto</p>
        </div>

        {msg   && <p className="text-sm text-center text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">{msg}</p>}
        {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3">{error}</p>}

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Crear familia</h3>
              <p className="text-xs text-gray-400">Sé el administrador e invita hasta 4 miembros</p>
            </div>
          </div>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input value={familyName} onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Nombre de tu familia" className="input flex-1" required />
            <button type="submit" disabled={busy} className="btn-primary w-auto px-4 py-2.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Crear
            </button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Unirte a una familia</h3>
              <p className="text-xs text-gray-400">Ingresa el token que recibiste por email</p>
            </div>
          </div>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input value={joinToken} onChange={(e) => setJoinToken(e.target.value)}
              placeholder="Token de invitación" className="input flex-1 font-mono text-sm" required />
            <button type="submit" disabled={busy} className="btn-primary w-auto px-4 py-2.5">
              Unirme
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Con familia ───────────────────────────────────────────────────────────
  const pendingInvites = family.invitations ?? [];

  const TABS = [
    { id: 'members',   label: 'Miembros',      emoji: '👥' },
    { id: 'dashboard', label: 'Dashboard',     emoji: '📊' },
    { id: 'budgets',   label: 'Presupuestos',  emoji: '🎯' },
    { id: 'goals',     label: 'Metas',         emoji: '🐷' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-5 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">🏠</div>
            <div>
              {editing ? (
                <form onSubmit={handleUpdate} className="flex gap-2 items-center">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="input-base text-sm py-1 text-gray-900 w-40" autoFocus />
                  <button type="submit" disabled={busy} className="text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition">Guardar</button>
                  <button type="button" onClick={() => setEditing(false)} className="text-white/60 hover:text-white text-xs">Cancelar</button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-white">{family.name}</h2>
                  {isAdmin && (
                    <button onClick={() => { setEditName(family.name); setEditing(true); }}
                      className="text-white/60 hover:text-white text-xs underline transition">editar</button>
                  )}
                </div>
              )}
              <p className="text-purple-200 text-sm mt-0.5">
                {memberCount} miembro{memberCount !== 1 ? 's' : ''} · {isAdmin ? 'Tú eres el administrador' : 'Eres miembro'}
              </p>
            </div>
          </div>
          <button onClick={fetch} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition" title="Actualizar">
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-center text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">{msg}</p>}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Miembros */}
      {tab === 'members' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" /> Miembros ({memberCount}/5)
            </h3>
            <div className="space-y-2">
              {family.members.map((m) => (
                <MemberCard key={m.id}
                  member={{ ...m, ...m.user, role: m.role, userId: m.userId || m.user?.id }}
                  isMe={m.userId === user?.id}
                  isAdmin={isAdmin}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>

          {pendingInvites.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Invitaciones pendientes ({pendingInvites.length})
              </h3>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <InvitationRow key={inv.id} invite={inv} onCancel={cancelInvite} />
                ))}
              </div>
            </div>
          )}

          {isAdmin && memberCount < 5 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-violet-500" /> Invitar miembro
                <span className="text-xs text-gray-400 font-normal ml-auto">{5 - memberCount} lugar{5 - memberCount !== 1 ? 'es' : ''} disponible{5 - memberCount !== 1 ? 's' : ''}</span>
              </h3>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="correo@ejemplo.com" className="input flex-1" required />
                <button type="submit" disabled={busy} className="btn-primary w-auto px-4 py-2.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Invitar
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                Se enviará un enlace de invitación válido por 7 días. El invitado no necesita tener cuenta — podrá registrarse al aceptar.
              </p>
            </div>
          )}

          {memberCount >= 5 && isAdmin && (
            <p className="text-xs text-center text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              Has alcanzado el límite de 5 miembros del plan Family.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {!isAdmin && (
              <button onClick={handleLeave} className="flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition">
                <LogOut className="w-4 h-4" /> Abandonar familia
              </button>
            )}
            {isAdmin && (
              <button onClick={handleDestroy} className="flex items-center gap-2 text-sm text-gray-400 hover:text-rose-500 transition ml-auto">
                <Trash2 className="w-4 h-4" /> Eliminar familia
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'dashboard' && <DashboardPanel dashboard={dashboard} />}

      {tab === 'budgets' && (
        <BudgetsPanel
          dashboard={dashboard}
          isAdmin={isAdmin}
          saveBudget={saveBudget}
          removeBudget={removeBudget}
        />
      )}

      {tab === 'goals' && (
        <GoalsPanel
          dashboard={dashboard}
          isAdmin={isAdmin}
          addGoal={addGoal}
          editGoal={editGoal}
          removeGoal={removeGoal}
          contributeGoal={contributeGoal}
        />
      )}
    </div>
  );
}

function FamilySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-3xl" />
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl w-80" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
    </div>
  );
}
