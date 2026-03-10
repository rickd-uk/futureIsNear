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

    const now = new Date();

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { lastSeenAt: now },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        bannedUntil: true,
        forceLogoutAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Token issued before force-logout timestamp → kick out
    if (user.forceLogoutAt && payload.iat * 1000 < user.forceLogoutAt.getTime()) {
      return NextResponse.json({ error: "Session invalidated" }, { status: 401 });
    }

    // Banned → kick out with reason
    if (user.bannedUntil && user.bannedUntil > now) {
      return NextResponse.json(
        { error: "Account banned", bannedUntil: user.bannedUntil },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
