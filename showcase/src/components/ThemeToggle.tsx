import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary dark:border-gray-800 dark:bg-[#151D2A] dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
