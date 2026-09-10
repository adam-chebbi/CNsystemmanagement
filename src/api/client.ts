const TOKEN_STORAGE_KEY = 'cn_auth_token';

export class ApiError extends Error {}

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // localStorage unavailable (e.g. private browsing) -- session just won't persist across reloads.
  }
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

const request = async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = data?.error?.message ?? `Erreur ${res.status}`;
    throw new ApiError(message);
  }

  return data as T;
};

export const apiGet = <T,>(path: string): Promise<T> => request<T>(path);
export const apiPost = <T,>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: 'POST', body });
export const apiPut = <T,>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: 'PUT', body });
export const apiPatch = <T,>(path: string, body?: unknown): Promise<T> => request<T>(path, { method: 'PATCH', body });
export const apiDelete = <T,>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' });
