import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  role: string;
  exp?: number;
}

export function isValidSecretPath(path:string): boolean {
  const adminSecretPath = process.env.ADMIN_SECRET_PATH;
  return path === adminSecretPath;
}

export async function validateAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = await cookieStore.get('admin-token');

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload?.role === 'admin';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
}

export async function authMiddleware(request: Request) {
  try {
    const isAuthenticated = await validateAuth();

    if (!isAuthenticated) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Please log in to access this resource'
        },
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: 'An error occurred while verifying authentication'
      },
      { status: 500 }
    );
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = await cookieStore.get('admin-token');

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify<JWTPayload>(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    return {
      role: payload.role,
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}
