export default function ComingSoon({ emoji, title, phase, desc, features = [], phaseColor = 'amber' }) {
  const colors = {
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    rose:    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-md w-full">
        <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-float">
          <span className="text-5xl">{emoji}</span>
        </div>
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 ${colors[phaseColor] || colors.amber}`}>
          {phase}
        </span>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{desc}</p>
        {features.length > 0 && (
          <ul className="space-y-2 text-left">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
