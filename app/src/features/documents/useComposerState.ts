import type { DocumentDto } from '@shared/types';
import { useState } from 'react';
import {
  blankComposerState,
  type ComposerFormState,
  composerStateFromDocument,
  createDiscount,
  createLineItem,
  type DiscountFormState,
  type LineItemFormState,
} from './composerState';

export function useComposerState(initial: DocumentDto | null) {
  const [state, setState] = useState<ComposerFormState>(() =>
    initial ? composerStateFromDocument(initial) : blankComposerState(),
  );

  function setField<K extends keyof ComposerFormState>(key: K, value: ComposerFormState[K]) {
    setState((previous) => ({ ...previous, [key]: value }));
  }

  function patchState(patch: Partial<ComposerFormState>) {
    setState((previous) => ({ ...previous, ...patch }));
  }

  function addLineItem() {
    setState((previous) => ({ ...previous, lineItems: [...previous.lineItems, createLineItem()] }));
  }

  function removeLineItem(key: string) {
    setState((previous) => ({
      ...previous,
      lineItems: previous.lineItems.filter((line) => line.key !== key),
    }));
  }

  function updateLineItem(key: string, patch: Partial<Omit<LineItemFormState, 'key'>>) {
    setState((previous) => ({
      ...previous,
      lineItems: previous.lineItems.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    }));
  }

  function addDiscount() {
    setState((previous) => ({ ...previous, discounts: [...previous.discounts, createDiscount()] }));
  }

  function removeDiscount(key: string) {
    setState((previous) => ({
      ...previous,
      discounts: previous.discounts.filter((discount) => discount.key !== key),
    }));
  }

  function updateDiscount(key: string, patch: Partial<Omit<DiscountFormState, 'key'>>) {
    setState((previous) => ({
      ...previous,
      discounts: previous.discounts.map((discount) =>
        discount.key === key ? { ...discount, ...patch } : discount,
      ),
    }));
  }

  return {
    state,
    setField,
    patchState,
    addLineItem,
    removeLineItem,
    updateLineItem,
    addDiscount,
    removeDiscount,
    updateDiscount,
  };
}

export type ComposerStateController = ReturnType<typeof useComposerState>;
