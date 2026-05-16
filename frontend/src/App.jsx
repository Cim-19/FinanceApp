import { useEffect } from 'react';
import AppRouter    from './router/AppRouter';
import useThemeStore from './store/themeStore';

export default function App() {
  const apply = useThemeStore((s) => s.apply);

  useEffect(() => {
    apply();
  }, [apply]);

  return <AppRouter />;
}
