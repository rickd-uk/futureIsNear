// src/lib/auth.ts
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JWTPayload {
  role: string;
  exp?: number;
}

export function isValidSecretPath(path: string): boolean {
  const adminSecretPath = process.env.ADMIN_SECRET_PATH;
  return path === adminSecretPath;
}

export async function validateAuth(request: NextRequest): Promise<boolean> {
  try {
    // First check cookies
    const cookieStore = await cookies();
    const cookieToken = await cookieStore.get('admin-token');

    // Then check Authorization header
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    // Use either cookie token or header token
    const token = cookieToken?.value || headerToken;

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify<JWTPayload>(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload?.role === 'admin';
  } catch (err) {
    console.error('Token verification failed:', err);
    return false;
  }
}

export async function authMiddleware(request: NextRequest) {
  try {
    if (!request) {
      console.error('Auth middleware error: request is undefined');
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'An error occurred while processing the request',
        },
        { status: 500 }
      );
    }
    const isAuthenticated = await validateAuth(request);

    if (!isAuthenticated) {
      // Check if this is an API request
      const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
      
      if (isApiRequest) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Please log in to access this resource'
          },
          { status: 401 }
        );
      } else {
        // Redirect to login for non-API requests
        const redirectUrl = `/${process.env.ADMIN_SECRET_PATH}/login`;
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
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
