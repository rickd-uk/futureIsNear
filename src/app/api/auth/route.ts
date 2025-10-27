import { NextResponse } from 'next/server';

// Simple hardcoded auth - replace with proper authentication in production
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // In production, generate a proper JWT token
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      
      return NextResponse.json({ 
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
