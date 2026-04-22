import { NextResponse } from 'next/server';
import { alerts, getAlertStats } from '@/lib/nms-data/mock-data';

export async function GET() {
  return NextResponse.json({
    alerts,
    stats: getAlertStats(),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { alertId, action } = body;

  // Mock acknowledge
  return NextResponse.json({
    success: true,
    message: `Alert ${alertId} ${action}`,
    alertId,
    action,
  });
}
