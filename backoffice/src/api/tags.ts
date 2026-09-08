import type { ApiTagType } from './api';

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
