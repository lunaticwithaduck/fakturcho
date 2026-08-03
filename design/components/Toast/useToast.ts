import { useSyncExternalStore } from 'react';

type ToastVariant = 'neutral' | 'success' | 'warning' | 'danger';

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastInput = Omit<ToastItem, 'id'>;

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

export function toast(input: ToastInput) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, ...input }];
  emit();
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

export function useToast() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { toasts: items, dismiss: dismissToast };
}

export type { ToastItem, ToastVariant };
