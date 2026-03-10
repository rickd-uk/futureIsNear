import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allow browser extension origins to call the API
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";
  const isExtension = origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://");

  if (!isExtension) return NextResponse.next();

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
