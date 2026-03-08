import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production";

export interface UserTokenPayload {
  type: "user";
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

export function createUserToken(userId: string, username: string): string {
  return jwt.sign(
    {
      type: "user",
      userId,
      username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserTokenPayload;

    if (payload.type !== "user") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: Request): UserTokenPayload | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  return verifyUserToken(token);
}

export function userUnauthorizedResponse() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}
