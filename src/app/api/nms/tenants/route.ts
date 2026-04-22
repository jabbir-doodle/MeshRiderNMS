import { NextResponse } from 'next/server';
import { tenants, operators } from '@/lib/nms-data/mock-data';

export async function GET() {
  return NextResponse.json({
    tenants,
    operators,
  });
}
