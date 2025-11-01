import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all unique categories from stories
    const stories = await prisma.story.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = stories
      .map(story => story.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { categoryName } = await request.json();

    if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingStory = await prisma.story.findFirst({
      where: {
        category: categoryName.trim(),
      },
    });

    if (existingStory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 400 }
      );
    }

    // Create a placeholder story to establish the category
    // This is a workaround since categories are derived from stories
    const placeholderStory = await prisma.story.create({
      data: {
        title: `[Category Placeholder] ${categoryName.trim()}`,
        url: '#',
        category: categoryName.trim(),
        description: 'This is a placeholder story to create a new category. You can delete it after adding real stories.',
        author: 'System',
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: categoryName.trim(),
      placeholderId: placeholderStory.id,
    });
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
