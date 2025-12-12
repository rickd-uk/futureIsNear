// src/lib/auth.ts
import { NextResponse } from "next/server";

export function checkAuth(request: Request): boolean {
  const token = request.headers.get("authorization");

  if (!token) {
    return false;
  }

  // Basic token validation
  // In production, verify JWT or session token properly
  try {
    const decoded = Buffer.from(
      token.replace("Bearer ", ""),
      "base64",
    ).toString();
    // Token format: "username:timestamp"
    const [username, timestamp] = decoded.split(":");

    // Check if token is from valid admin session
    // For now, just check if it's properly formatted
    return !!username && !!timestamp;
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized - Admin access required" },
    { status: 401 },
  );
}
