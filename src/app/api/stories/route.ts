import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      orderBy: {
        timestamp: 'desc'
      }
    })
    
    return NextResponse.json(stories)
  } catch (error) {
    console.error('Failed to fetch stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    )
  }
}
