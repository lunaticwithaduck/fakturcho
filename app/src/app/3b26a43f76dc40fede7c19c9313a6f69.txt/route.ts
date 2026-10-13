const INDEXNOW_KEY = '3b26a43f76dc40fede7c19c9313a6f69';

export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { 'Content-Type': 'text/plain' } });
}
