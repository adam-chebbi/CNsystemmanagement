import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

// Tiny History-API router: three pages don't justify a dependency. The host must serve
// index.html for unknown paths (see deploy/nginx.conf.example — `try_files … /index.html`).

interface RouterValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function currentPath(): string {
  const p = window.location.pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname === window.location.pathname && url.hash === window.location.hash) return;
    window.history.pushState({}, '', url.pathname + url.search + url.hash);
    setPath(currentPath());
    if (url.hash) {
      // Let the new page render, then scroll to the anchor.
      requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside <Router>');
  return ctx;
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
