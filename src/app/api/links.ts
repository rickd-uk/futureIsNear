import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { title, url, description, category,  author,  timestamp, } = await request.json();

    const newLink = await prisma.link.create({
      data: {
        title,
        url,
        description,
        category,
        author,
        timestamp: new Date(timestamp),
      },
    });

    return NextResponse.json(newLink);
  } catch (error) {
    console.error('Error creating new link:', error);
    return NextResponse.json(
      { error: 'Failed to create new link' },
      { status: 500 }
    );
  }
}
