import { lazy, type ComponentType } from 'react';

/**
 * A wrapper around React.lazy() that handles stale chunk errors after deployment.
 *
 * Problem: When a new version is deployed to Vercel, the old JS chunks are deleted.
 * Users with a cached index.html still reference old chunk filenames, causing
 * "Failed to fetch dynamically imported module" errors (HTTP 404 on .js files).
 *
 * Solution: Catch the import error, reload the page once to fetch the new index.html,
 * and use sessionStorage to prevent infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    const RELOAD_KEY = 'chunk-reload-attempted';

    try {
      return await factory();
    } catch (error) {
      // Only attempt reload once per session to prevent infinite loops
      const hasReloaded = sessionStorage.getItem(RELOAD_KEY);

      if (!hasReloaded) {
        sessionStorage.setItem(RELOAD_KEY, 'true');
        window.location.reload();
        // Return a never-resolving promise while the page reloads
        return new Promise<{ default: T }>(() => {});
      }

      // If we already reloaded and it still fails, clear the flag and throw
      sessionStorage.removeItem(RELOAD_KEY);
      throw error;
    }
  });
}
