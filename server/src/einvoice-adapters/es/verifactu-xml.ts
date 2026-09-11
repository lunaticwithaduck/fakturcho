import { textEl } from './xml';

export function sf(tag: string, value: string): string {
  return textEl(`sf:${tag}`, value);
}
