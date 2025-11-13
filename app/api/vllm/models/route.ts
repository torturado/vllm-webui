import { NextResponse } from 'next/server';
import { listModels } from '@/lib/vllm-client';

export async function GET() {
  try {
    const models = await listModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
