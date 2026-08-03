const AUTH_STORAGE_KEY = 'fakturcho-admin-auth';

export const PLACEHOLDER_ADMIN_EMAIL = 'admin@fakturcho.bg';
export const PLACEHOLDER_ADMIN_PASSWORD = 'admin';

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

export function setAuthenticated(): void {
  localStorage.setItem(AUTH_STORAGE_KEY, 'true');
}

export function clearAuthenticated(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function checkCredentials(email: string, password: string): boolean {
  return email === PLACEHOLDER_ADMIN_EMAIL && password === PLACEHOLDER_ADMIN_PASSWORD;
}
