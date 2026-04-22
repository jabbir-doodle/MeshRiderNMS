import { NextResponse } from 'next/server';
import { otaCampaigns } from '@/lib/nms-data/mock-data';

export async function GET() {
  return NextResponse.json({
    campaigns: otaCampaigns,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, firmware, radioIds } = body;

  return NextResponse.json({
    success: true,
    campaign: {
      id: String(otaCampaigns.length + 1).padStart(2, '0'),
      name,
      firmware,
      status: 'scheduled',
      total: radioIds?.length || 0,
      completed: 0,
      failed: 0,
      owner: 'current-user',
      createdAt: new Date().toISOString(),
    },
  });
}
