/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_CODE: string
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
