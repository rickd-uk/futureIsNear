import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  //if (pathname.includes('/admin/')) {
  //  return NextResponse.redirect(new URL('/404', request.url));
  //}
  const secretPathMatch = pathname.match(/^\/([^\/]+)\/(login|dashboard)/);
  if (secretPathMatch) {
    const [, potentialSecret, page] = secretPathMatch;

    if (potentialSecret !== process.env.ADMIN_SECRET_PATH) {
      // return 404 for invalid search path 
      return NextResponse.redirect(new URL('/404', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*',
  ],
}
