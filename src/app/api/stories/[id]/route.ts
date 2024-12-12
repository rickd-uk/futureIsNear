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
