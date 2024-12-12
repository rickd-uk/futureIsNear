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
