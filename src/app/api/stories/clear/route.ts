import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    const result = await prisma.story.deleteMany({});

    return NextResponse.json({ 
      success: true,
      message: `Deleted ${result.count} stories`,
      count: result.count
    });
  } catch (error) {
    console.error('Error clearing stories:', error);
    return NextResponse.json(
      { error: 'Failed to clear stories' },
      { status: 500 }
    );
  }
}
