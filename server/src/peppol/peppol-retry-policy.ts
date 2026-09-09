export const MAX_TRANSMISSION_RETRIES = 3;

export function shouldRetry(transmission: { status: string; retryCount: number }): boolean {
  return transmission.status === 'REJECTED' && transmission.retryCount < MAX_TRANSMISSION_RETRIES;
}
