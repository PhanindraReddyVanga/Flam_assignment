import { NextResponse } from 'next/server';
import { generateInitialDataset, generateStreamingDataBatch } from '@/lib/dataGenerator';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'initial';
  const count = parseInt(searchParams.get('count') || '10000', 10);
  const timestamp = parseInt(searchParams.get('timestamp') || '0', 10);

  try {
    if (type === 'initial') {
      const data = generateInitialDataset(Math.min(count, 10000));
      return NextResponse.json({ data });
    } else if (type === 'stream') {
      const data = generateStreamingDataBatch(
        Math.min(count, 100),
        timestamp || Date.now()
      );
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Data generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate data' },
      { status: 500 }
    );
  }
}
