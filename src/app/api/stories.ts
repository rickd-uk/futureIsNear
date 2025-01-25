// src/app/api/stories.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { title, url, description, category,  author,  timestamp, } = await request.json();

    const newStory = await prisma.story.create({
      data: {
        title,
        url,
        description,
        category,
        author,
        timestamp: new Date(timestamp),
      },
    });

    return NextResponse.json(newStory);
  } catch (error) {
    console.error('Error creating new story:', error);
    return NextResponse.json(
      { error: 'Failed to create new story' },
      { status: 500 }
    );
  }
}
