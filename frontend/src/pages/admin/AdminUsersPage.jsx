import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff, Star, UserX, UserCheck, X } from 'lucide-react';
import { getAdminUsers, getAdminUser, updateUserPlan, toggleUserActive, updateUserRole } from '../../api/admin';
import { formatCurrency } from '../../utils/formatCurrency';

const PLAN_BADGE = {
  FREE:   'bg-gray-100   dark:bg-gray-800   text-gray-600   dark:text-gray-300',
  PRO:    'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  FAMILY: 'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300',
};

const PLAN_EMOJI = { FREE: '🆓', PRO: '⭐', FAMILY: '👨‍👩‍👧' };

// ── User detail modal ─────────────────────────────────────────────────────────

function UserDetailModal({ userId, onClose, onRefresh }) {
  const [user,    setUser   ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy   ] = useState(false);

  useEffect(() => {
    getAdminUser(userId)
      .then(({ data }) => setUser(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handlePlan = async (plan) => {
    setBusy(true);
    try {
      await updateUserPlan(userId, plan);
      const { data } = await getAdminUser(userId);
      setUser(data.data);
      onRefresh();
    } finally { setBusy(false); }
  };

  const handleToggle = async () => {
    setBusy(true);
    try {
      await toggleUserActive(userId);
      const { data } = await getAdminUser(userId);
      setUser(data.data);
      onRefresh();
    } finally { setBusy(false); }
  };

  const handleRole = async (role) => {
    setBusy(true);
    try {
      await updateUserRole(userId, role);
      const { data } = await getAdminUser(userId);
      setUser(data.data);
      onRefresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-y-auto max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">Detalle de usuario</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
            </div>
          ) : user && (
            <>
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-lg">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[user.subscription?.plan || 'FREE']}`}>
                      {PLAN_EMOJI[user.subscription?.plan || 'FREE']} {user.subscription?.plan || 'FREE'}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                        🛡️ Admin
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        🚫 Desactivado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Cuentas',       val: user._count.accounts     },
                  { label: 'Transacciones', val: user._count.transactions },
                  { label: 'Presupuestos',  val: user._count.budgets      },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xl font-extrabold text-gray-800 dark:text-white">{s.val}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>📅 Miembro desde: <span className="font-medium text-gray-700 dark:text-gray-200">{new Date(user.createdAt).toLocaleDateString('es-PE', { dateStyle: 'long' })}</span></p>
                <p>💱 Moneda: <span className="font-medium text-gray-700 dark:text-gray-200">{user.currency}</span></p>
              </div>

              {/* Recent transactions */}
              {user.recentTransactions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Últimas transacciones</p>
                  <div className="space-y-1.5">
                    {user.recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <span className={`font-medium ${tx.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'INGRESO' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </span>
                        <span className="text-gray-400 text-xs">{new Date(tx.date).toLocaleDateString('es-PE')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">

                {/* Change plan */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cambiar plan</p>
                  <div className="flex gap-2">
                    {['FREE', 'PRO', 'FAMILY'].map((p) => (
                      <button key={p} onClick={() => handlePlan(p)} disabled={busy || user.subscription?.plan === p}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all disabled:opacity-40 ${
                          user.subscription?.plan === p
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}>
                        {PLAN_EMOJI[p]} {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle active + Role */}
                <div className="flex gap-2">
                  <button onClick={handleToggle} disabled={busy}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                      user.isActive
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                    }`}>
                    {user.isActive ? <><UserX className="w-4 h-4" /> Desactivar</> : <><UserCheck className="w-4 h-4" /> Activar</>}
                  </button>
                  <button onClick={() => handleRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN')} disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition disabled:opacity-50">
                    {user.role === 'ADMIN' ? <><ShieldOff className="w-4 h-4" /> Quitar admin</> : <><Shield className="w-4 h-4" /> Hacer admin</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users,   setUsers  ] = useState([]);
  const [total,   setTotal  ] = useState(0);
  const [pages,   setPages  ] = useState(1);
  const [page,    setPage   ] = useState(1);
  const [search,  setSearch ] = useState('');
  const [plan,    setPlan   ] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected,setSelected] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAdminUsers({ search, plan: plan || undefined, page, limit: 15 });
      setUsers(data.data.users);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch {}
    finally { setLoading(false); }
  }, [search, plan, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handlePlan   = (p)  => { setPlan(p); setPage(1); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Usuarios</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-base pl-9" placeholder="Buscar por nombre o email…"
            value={search} onChange={handleSearch} />
        </div>
        <div className="flex gap-2">
          {[{ val: '', label: 'Todos' }, { val: 'FREE', label: '🆓 Free' }, { val: 'PRO', label: '⭐ Pro' }, { val: 'FAMILY', label: '👨‍👩‍👧 Family' }].map((opt) => (
            <button key={opt.val} onClick={() => handlePlan(opt.val)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                plan === opt.val
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Cuentas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Transacciones</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map((u) => (
                <tr key={u.id}
                  onClick={() => setSelected(u.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white truncate">
                          {u.name}
                          {u.role === 'ADMIN' && <span className="ml-1.5 text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PLAN_BADGE[u.subscription?.plan || 'FREE']}`}>
                      {PLAN_EMOJI[u.subscription?.plan || 'FREE']} {u.subscription?.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200 font-medium">{u._count.accounts}</td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200 font-medium">{u._count.transactions}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      u.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {u.isActive ? '✅ Activo' : '🚫 Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString('es-PE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400">Página {page} de {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <UserDetailModal userId={selected} onClose={() => setSelected(null)} onRefresh={fetch} />
      )}
    </div>
  );
}
