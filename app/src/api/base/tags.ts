import type { ApiTagType } from './apiSlice';

export interface TagDescriptor {
  type: ApiTagType;
  id: string;
}

export function listTag(type: ApiTagType): TagDescriptor {
  return { type, id: 'LIST' };
}

export function idTag(type: ApiTagType, id: string): TagDescriptor {
  return { type, id };
}

export function provideList<T extends { id: string }>(
  type: ApiTagType,
  results: readonly T[] | undefined,
): TagDescriptor[] {
  if (!results) return [listTag(type)];
  return [...results.map((item) => idTag(type, item.id)), listTag(type)];
}
