import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

interface CSVStory {
    title: string;
    url: string;
    category: string;
    description? : string;
    author?: string;
    timestamp: string;
}

export async function GET() {
    try {
        // Read the test CSV file
        const csvPath = path.join(process.cwd(), 'public', 'test.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        
        // Parse CSV
        const parseResult = Papa.parse<CSVStory>(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            return NextResponse.json(
                { error: 'CSV parsing failed', details: parseResult.errors },
                { status: 400 }
            );
        }

        const stories = parseResult.data;
        let inserted = 0;

        // Process stories
        for (const story of stories) {
            await prisma.story.create({
                data: {
                    title: story.title,
                    url: story.url,
                    category: story.category,
                    description: story.description?.trim(), 
                    author: story.author?.trim() || 'Unknown Author',
                    timestamp: new Date(),
                }
            });
            inserted++;
        }

        return NextResponse.json({ 
            success: true,
            message: `Successfully added ${inserted} stories`,
            stories: stories
        });

    } catch (error) {
        console.error('Test upload error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process test upload',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
