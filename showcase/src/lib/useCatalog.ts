import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog, type Catalog } from '../api/products';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; catalog: Catalog };

/** Loads the live catalog from the management system's public API. */
export function useCatalog() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback((force: boolean) => {
    setState({ status: 'loading' });
    let cancelled = false;
    fetchCatalog(force)
      .then((catalog) => !cancelled && setState({ status: 'ready', catalog }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(false), [load]);

  const retry = useCallback(() => {
    load(true);
  }, [load]);

  return { state, retry };
}
