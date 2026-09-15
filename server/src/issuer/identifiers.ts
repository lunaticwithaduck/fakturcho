import type { Prisma } from '@prisma/client';

export function readIdentifiers(
  value: Prisma.JsonValue | null | undefined,
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string' && entry.trim() !== '') result[key] = entry;
  }
  return result;
}
