import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function MonthSelector({ month, year, onChange }) {
  const prev = () => {
    if (month === 1) onChange(12, year - 1);
    else             onChange(month - 1, year);
  };
  const next = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) onChange(1, year + 1);
    else              onChange(month + 1, year);
  };

  const isCurrentMonth = (() => {
    const now = new Date();
    return month === now.getMonth() + 1 && year === now.getFullYear();
  })();

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl px-3 py-2 shadow-card border border-gray-100 dark:border-gray-700">
      <button onClick={prev}
        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 min-w-[140px] justify-center">
        <Calendar className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-gray-800 dark:text-white">
          {MONTHS[month - 1]} {year}
        </span>
      </div>

      <button onClick={next} disabled={isCurrentMonth}
        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
