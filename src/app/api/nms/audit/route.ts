import { NextResponse } from 'next/server';
import { auditEvents } from '@/lib/nms-data/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  let filtered = [...auditEvents];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      e =>
        e.operator.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.object.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    events: filtered,
    total: filtered.length,
  });
}
