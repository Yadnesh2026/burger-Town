import { dashboard } from '@/lib/data';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { const q = new URL(request.url).searchParams; return Response.json(dashboard(Object.fromEntries([...q].filter(([, v]) => v))), { headers: { 'Cache-Control': 'public, max-age=60' } }); }
