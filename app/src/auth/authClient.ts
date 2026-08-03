import { createAuthClient } from 'better-auth/react';

/**
 * No explicit baseURL: better-auth validates it with `new URL(...)`, which
 * throws on a bare relative string in both SSR and the browser. Omitting it
 * lets better-auth resolve `window.location.origin + '/api/auth'` in the
 * browser (same origin, so the Next.js /api/* rewrite still applies) and a
 * safe unvalidated fallback during SSR module evaluation.
 */
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;
