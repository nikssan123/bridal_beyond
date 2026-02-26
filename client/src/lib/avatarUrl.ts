const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:4000';

/**
 * Resolves avatar URL for display. If avatarUrl is a path (starts with /),
 * prepends API origin so the browser can load it. Otherwise returns as-is (external URL).
 */
export function getAvatarUrl(avatarUrl: string | undefined | null): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('/')) return `${API_ORIGIN}${avatarUrl}`;
  return avatarUrl;
}
