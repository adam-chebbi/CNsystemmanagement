/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute base URL of the Café Noir management API (no trailing slash). Overrides the default. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
