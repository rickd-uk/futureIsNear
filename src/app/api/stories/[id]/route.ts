// src/app/api/stories/[id]/route.ts 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // check authentication first 
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  try { await prisma.story.delete({
    where: { id: params.id },
  });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      {status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Check authentication first
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
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
      where: { id: params.id },
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
