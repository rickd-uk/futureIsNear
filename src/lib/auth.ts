// src/lib/auth.ts
import { NextResponse } from "next/server";

export function checkAuth(request: Request): boolean {
  const token = request.headers.get("authorization");

  if (!token) {
    return false;
  }

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  if (!ADMIN_USERNAME) {
    return false;
  }

  try {
    const decoded = Buffer.from(
      token.replace("Bearer ", ""),
      "base64",
    ).toString();
    // Token format: "username:timestamp"
    const colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) return false;
    const username = decoded.slice(0, colonIndex);
    const timestamp = decoded.slice(colonIndex + 1);

    return username === ADMIN_USERNAME && !!timestamp;
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
