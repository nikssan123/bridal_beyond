const RAW_API_BASE = import.meta.env.VITE_API_URL as string | undefined;
const IS_DEV = import.meta.env.DEV;

// In dev (npm run dev), always talk to the local backend on http://localhost:4000/api,
// regardless of VITE_API_URL from .env. This avoids accidentally pointing dev at prod.
// In prod builds, use VITE_API_URL if provided, otherwise default to /api (behind nginx).
export const API_BASE: string = IS_DEV ? 'http://localhost:4000/api' : RAW_API_BASE || '/api';

// Origin used for images and websockets.
export const API_ORIGIN: string =
  API_BASE.startsWith('http')
    ? API_BASE.replace(/\/api\/?$/, '')
    : (typeof window !== 'undefined' ? window.location.origin : '');

