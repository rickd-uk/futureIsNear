// src/app/api/stats/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalStories, categories, latestStory] = await Promise.all([
      prisma.story.count(),
      prisma.story.groupBy({
        by: ['category'],
        _count: true
      }),
      prisma.story.findFirst({
        orderBy: {
          timestamp: 'desc'
        },
        select: {
          timestamp: true
        }
      })
    ]);

    return NextResponse.json({
      totalStories,
      categoriesCount: categories.length,
      latestUpload: latestStory?.timestamp
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
