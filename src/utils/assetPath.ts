/**
 * Resolves static asset paths taking into account Vite's base path
 * (e.g., '/' for local development and '/Lexi/' for GitHub Pages).
 */
export function getAssetPath(relativePath: string): string {
  if (!relativePath) return '';
  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('data:') ||
    relativePath.startsWith('blob:')
  ) {
    return relativePath;
  }

  const rawBase = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL 
    ? import.meta.env.BASE_URL 
    : '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  // Idempotency: If the path is already prefixed with base, do not double-prefix
  if (relativePath.startsWith(base) || (rawBase !== '/' && relativePath.startsWith(rawBase))) {
    return relativePath;
  }

  const clean = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${base}${clean}`;
}
