// src/app/api/stories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
) {
  // check authentication first
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // Get the ID from the URL pattern
  const id = request.url.split('/').pop();
  if (!id) {
    return NextResponse.json(
      { error: 'Story ID not found' },
      { status: 400 }
    );
  }

  try {
    await prisma.story.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
) {
  // Check authentication first
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // Get the ID from the URL pattern
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  if (!id) {
    return NextResponse.json(
      { error: 'Story ID not found' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.url || !body.category || !body.author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedStory = await prisma.story.update({
      where: { id },
      data: {
        title: body.title,
        url: body.url,
        category: body.category,
        author: body.author,
        description: body.description,
      },
    });

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json(
      { error: 'Failed to update story' },
      { status: 500 }
    );
  }
}

