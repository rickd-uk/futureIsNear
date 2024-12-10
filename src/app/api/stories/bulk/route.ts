import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import { authMiddleware } from '@/lib/auth';

interface CSVStory {
  title: string;
  url: string;
  category: string;
  description?: string;
  author?: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Check authentication first
  const authResponse = await authMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const csvText = await file.text();
    console.log('CSV Content preview:', csvText.substring(0, 100));

    // Parse CSV with proper configuration
    const parseResult = Papa.parse<CSVStory>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      console.error('Parse errors:', parseResult.errors);
      return NextResponse.json(
        { 
          error: 'CSV parsing failed', 
          details: parseResult.errors.map(err => ({
            row: err.row,
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const stories = parseResult.data;
    console.log('Parsed stories:', stories.length);

    // Validate required fields and data format
    const validationErrors: { row: number; errors: string[] }[] = [];
    
    stories.forEach((story, index) => {
      const rowErrors: string[] = [];

      // Check required fields
      if (!story.title) rowErrors.push('Title is required');
      if (!story.url) rowErrors.push('URL is required');
      if (!story.category) rowErrors.push('Category is required');

      // URL format validation
      if (story.url && !isValidUrl(story.url)) {
        rowErrors.push('Invalid URL format');
      }

      // Add length validations
      if (story.title && story.title.length > 255) {
        rowErrors.push('Title exceeds 255 characters');
      }
      if (story.description && story.description.length > 1000) {
        rowErrors.push('Description exceeds 1000 characters');
      }

      if (rowErrors.length > 0) {
        validationErrors.push({
          row: index + 2, // +2 because of 0-based index and header row
          errors: rowErrors
        });
      }
    });

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Insert stories into the database
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[]
    };

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        try {
          await tx.story.create({
            data: {
              title: story.title,
              url: story.url,
              category: story.category,
              description: story.description || 'No description provided',
              author: story.author || 'Unknown Author',
              timestamp: new Date(),
            }
          });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
    });

    // Return detailed results
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${stories.length} stories`,
      details: {
        total: stories.length,
        successful: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process bulk upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
