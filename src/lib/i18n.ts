import en from '@spec/en.json';
import local from '@/i18n/en.local.json';

/**
 * Copy bundle: the vendored spec bundle, overlaid by the app-owned
 * `src/i18n/en.local.json`. New or changed copy goes in the local file; mirroring
 * it into the spec is optional (specs are reference material, not a gate).
 */
const bundle: Record<string, string> = { ...(en as Record<string, string>), ...(local as Record<string, string>) };

/** Resolve an i18n key with {param} interpolation. Missing key → the key itself (AGENTS.md hard rules: never inline copy). */
export function t(key: string, params?: Record<string, string | number>): string {
  let s = bundle[key];
  if (s === undefined) {
    if (typeof console !== 'undefined') console.warn(`[i18n] missing key: ${key}`);
    s = key;
  }
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
export function hasKey(key: string): boolean { return bundle[key] !== undefined; }
