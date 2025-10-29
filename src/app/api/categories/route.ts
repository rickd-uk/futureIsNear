import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all unique categories from stories
    const stories = await prisma.story.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = stories
      .map(story => story.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
