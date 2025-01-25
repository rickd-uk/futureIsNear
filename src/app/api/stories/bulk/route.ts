// src/app/api/stories/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
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

    // Read and parse CSV
    const csvText = await file.text();
    const parseResult = Papa.parse<CSVStory>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'CSV parsing failed', 
          details: parseResult.errors 
        },
        { status: 400 }
      );
    }

    const stories = parseResult.data;

    // Validate required fields and data format
    const validationErrors: { row: number; errors: string[] }[] = [];
    stories.forEach((story, index) => {
      const rowErrors: string[] = [];
      if (!story.title) rowErrors.push('Title is required');
      if (!story.url) rowErrors.push('URL is required');
      if (!story.category) rowErrors.push('Category is required');
      if (story.url && !isValidUrl(story.url)) {
        rowErrors.push('Invalid URL format');
      }
      if (rowErrors.length > 0) {
        validationErrors.push({
          row: index + 2,
          errors: rowErrors
        });
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // Track results
    const results = {
      successful: 0,
      duplicates: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
      skippedUrls: [] as string[]
    };

    // Process stories in transaction
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        try {
          // Check for duplicate URL
          const existing = await tx.story.findFirst({
            where: { url: story.url.trim() }
          });

          if (existing) {
            results.duplicates++;
            results.skippedUrls.push(story.url);
            continue; // Skip this story
          }

          // Create new story if no duplicate found
          await tx.story.create({
            data: {
              title: story.title.trim(),
              url: story.url.trim(),
              category: story.category.trim(),
              description: story.description?.trim() || 'No description provided',
              author: story.author?.trim() || 'Unknown Author',
              timestamp: new Date(),
            }
          });
          results.successful++;
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
      message: `Processed ${stories.length} stories`,
      details: {
        total: stories.length,
        successful: results.successful,
        duplicates: results.duplicates,
        failed: results.failed,
        errors: results.errors,
        skippedUrls: results.skippedUrls
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
