'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { Toast } from './Toast';
import { ToastViewport } from './ToastViewport';
import { dismissToast, useToast } from './useToast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((item) => (
        <Toast
          key={item.id}
          item={item}
          onOpenChange={(open) => {
            if (!open) dismissToast(item.id);
          }}
        />
      ))}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}
