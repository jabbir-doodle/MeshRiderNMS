import { NextResponse } from 'next/server';
import { spectrumData, channelUtilization, spectrumEvents } from '@/lib/nms-data/mock-data';

export async function GET() {
  return NextResponse.json({
    spectrum: spectrumData,
    channels: channelUtilization,
    events: spectrumEvents,
  });
}
