import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  console.log('Starting GET request to /api/stories')
  
  try {
    // Test database connection
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('Database connection successful')

    // Attempt to fetch stories
    console.log('Fetching stories...')
    const stories = await prisma.story.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    })
    console.log('Stories fetched:', stories)

    // Ensure we have a valid response object
    const response = {
      success: true,
      data: stories || []
    }
    console.log('Preparing response:', response)

    return NextResponse.json(response)
    
  } catch (error) {
    // Log the full error for debugging
    if (error instanceof Error){
      console.error('Detailed error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error:', error);
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stories'
    }, {
      status: 500
    })
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect()
  }
}
