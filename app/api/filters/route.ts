import { filters } from '@/lib/data';
export const dynamic = 'force-dynamic';
export async function GET() { return Response.json(filters(), { headers: { 'Cache-Control': 'public, max-age=300' } }); }
