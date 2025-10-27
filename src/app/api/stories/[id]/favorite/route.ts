import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the current story
    const story = await prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Toggle the favorited status
    const updatedStory = await prisma.story.update({
      where: { id },
      data: {
        favorited: !story.favorited,
      },
    });

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
