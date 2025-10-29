import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all unique authors from stories
    const stories = await prisma.story.findMany({
      select: {
        author: true,
      },
      distinct: ['author'],
      where: {
        author: {
          not: null,
        },
      },
    });

    const authors = stories
      .map(story => ({ name: story.author! }))
      .filter(author => author.name !== 'Unknown Author')
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Failed to fetch authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}
