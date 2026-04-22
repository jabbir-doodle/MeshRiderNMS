import { NextResponse } from 'next/server';
import { radios, links, getRadioStats } from '@/lib/nms-data/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const site = searchParams.get('site');
  const state = searchParams.get('state');
  const search = searchParams.get('search');

  let filtered = [...radios];

  if (site && site !== 'all') {
    filtered = filtered.filter(r => r.siteId === site);
  }
  if (state && state !== 'all') {
    filtered = filtered.filter(r => r.state === state);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      r =>
        r.callsign.toLowerCase().includes(q) ||
        r.mac.toLowerCase().includes(q) ||
        r.siteName.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    radios: filtered,
    links,
    stats: getRadioStats(),
  });
}
