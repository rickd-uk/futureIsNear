import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, url, category, description, author } = body;

    // Validate required fields
    if (!title?.trim() || !url?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'Title, URL, and category are required' },
        { status: 400 }
      );
    }

    // Create the story
    const newStory = await prisma.story.create({
      data: {
        title: title.trim(),
        url: url.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        author: author?.trim() || null,
      },
    });

    return NextResponse.json(newStory, { status: 201 });
  } catch (error) {
    console.error('Failed to create story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
