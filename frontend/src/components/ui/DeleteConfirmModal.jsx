import { X, Trash2 } from 'lucide-react';

export default function DeleteConfirmModal({ open, onClose, onConfirm, title, description, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-slide-up text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">{title || '¿Eliminar?'}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description || 'Esta acción no se puede deshacer.'}</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancelar</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Trash2 className="w-4 h-4" /> Eliminar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
