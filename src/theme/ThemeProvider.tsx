import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };

const Ctx = createContext<ThemeCtx>({ theme: 'light', setTheme: () => {}, toggle: () => {} });

const KEY = 'trinity-theme';

function initial(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initial);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080b14' : '#f3f4f7');
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/** Read a CSS custom property from <html> (re-evaluated whenever the theme changes). */
export function useCssVar(name: string): string {
  const { theme } = useTheme();
  const [v, setV] = useState('');
  useEffect(() => {
    setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name, theme]);
  return v;
}

/** Theme-dependent value helper: pick(light, dark). */
export function usePick() {
  const { theme } = useTheme();
  return useCallback(<T,>(light: T, dark: T): T => (theme === 'dark' ? dark : light), [theme]);
}
