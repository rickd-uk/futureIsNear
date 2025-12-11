import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // If env vars not set, return error
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error(
        "ADMIN_USERNAME or ADMIN_PASSWORD environment variables not set!",
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // In production, generate a proper JWT token
      const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

      return NextResponse.json({
        success: true,
        token,
        message: "Login successful",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
