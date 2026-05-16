import { useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import useCategories      from '../hooks/useCategories';
import CategoryModal      from '../components/categories/CategoryModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';

const TYPE_BADGE = {
  INGRESO: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  EGRESO:  'bg-rose-100    dark:bg-rose-900/30    text-rose-700    dark:text-rose-300',
  AMBOS:   'bg-violet-100  dark:bg-violet-900/30  text-violet-700  dark:text-violet-300',
};
const TYPE_LABEL = { INGRESO: 'Ingreso', EGRESO: 'Gasto', AMBOS: 'Ambos' };

function CategoryCard({ cat, onEdit, onDelete }) {
  return (
    <div className="card flex items-center gap-3 group hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (cat.color || '#6366f1') + '22', border: `2px solid ${(cat.color || '#6366f1')}33` }}>
        {cat.icon || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{cat.name}</p>
        <span className={`inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[cat.type]}`}>
          {TYPE_LABEL[cat.type]}
        </span>
      </div>

      {cat.isSystem ? (
        <div className="flex items-center gap-1 text-gray-300 dark:text-gray-600 flex-shrink-0">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">Sistema</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit(cat)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(cat)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { system, custom, loading, create, update, remove } = useCategories();

  const [modal,      setModal    ] = useState(false);
  const [editing,    setEditing  ] = useState(null);
  const [delTarget,  setDelTarget] = useState(null);
  const [delBusy,    setDelBusy  ] = useState(false);

  const openCreate = ()    => { setEditing(null); setModal(true); };
  const openEdit   = (cat) => { setEditing(cat);  setModal(true); };

  const handleSave = async (form) => {
    if (editing) await update(editing.id, form);
    else         await create(form);
  };

  const handleDelete = async () => {
    setDelBusy(true);
    try { await remove(delTarget.id); setDelTarget(null); }
    finally { setDelBusy(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">Categorías</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Organiza tus transacciones por categoría
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Custom categories */}
          {custom.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Mis categorías ({custom.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {custom.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={setDelTarget} />
                ))}
              </div>
            </section>
          )}

          {/* System categories */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Categorías del sistema ({system.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {system.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={setDelTarget} />
              ))}
            </div>
          </section>

          {custom.length === 0 && system.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-3">🏷️</span>
              <p>No hay categorías aún</p>
            </div>
          )}
        </>
      )}

      <CategoryModal
        open={modal}
        onClose={() => setModal(false)}
        onSave={handleSave}
        editing={editing}
      />

      <DeleteConfirmModal
        open={!!delTarget}
        title="¿Eliminar categoría?"
        description={`Se eliminará "${delTarget?.name}". Las transacciones asociadas quedarán sin categoría.`}
        busy={delBusy}
        onConfirm={handleDelete}
        onClose={() => setDelTarget(null)}
      />
    </div>
  );
}
