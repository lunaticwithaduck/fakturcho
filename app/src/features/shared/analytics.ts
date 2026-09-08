type EventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: EventPayload) => void;
    };
  }
}

export function trackEvent(name: string, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track(name, payload);
  } catch {}
}
