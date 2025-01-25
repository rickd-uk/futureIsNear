// src/app/stories/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    return NextResponse.json(stories);
  } catch (err) {
    console.error('Failed to fetch stories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
