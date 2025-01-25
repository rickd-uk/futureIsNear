// src/app/api/auth/route.ts

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'your-secure-password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(new TextEncoder().encode(JWT_SECRET));

    const cookieStore = await cookies();

    // Set cookie
    await cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7200 // 2 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Endpoint to check if user is logged in
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token');

  return NextResponse.json({ 
    isAuthenticated: !!token 
  });
}

// Logout endpoint
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-token');
  return NextResponse.json({ success: true });
}
