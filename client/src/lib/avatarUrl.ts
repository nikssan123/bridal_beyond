import { API_ORIGIN } from './apiBase';

/**
 * Resolves avatar URL for display. If avatarUrl is a path (starts with /),
 * prepends API origin so the browser can load it. Otherwise returns as-is (external URL).
 */
export function getAvatarUrl(avatarUrl: string | undefined | null): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('/')) return `${API_ORIGIN}${avatarUrl}`;
  return avatarUrl;
}
