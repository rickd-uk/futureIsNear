import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/userAuth";

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get fresh user data and update lastSeenAt
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { lastSeenAt: new Date() },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
