const API_PREFIX = '/api';

export function toApiPath(route: string): string {
  if (!route.startsWith(API_PREFIX)) return route;
  return route.slice(API_PREFIX.length) || '/';
}
