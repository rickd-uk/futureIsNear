import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// GET /api/admin/users — list all real (non-test) users
export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const users = await prisma.user.findMany({
    where: { isTestUser: false },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      lastSeenAt: true,
      bannedUntil: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users — perform action on a user
// body: { userId, action: "ban" | "unban" | "logout" | "delete", bannedUntil?: string }
export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const { userId, action, bannedUntil: bannedUntilStr } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ error: "userId and action are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.isTestUser) return NextResponse.json({ error: "Cannot manage test users here" }, { status: 400 });

  const now = new Date();

  if (action === "ban") {
    const until = bannedUntilStr ? new Date(bannedUntilStr) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: until, forceLogoutAt: now },
    });
    return NextResponse.json({ success: true, bannedUntil: until });
  }

  if (action === "unban") {
    await prisma.user.update({
      where: { id: userId },
      data: { bannedUntil: null },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "logout") {
    await prisma.user.update({
      where: { id: userId },
      data: { forceLogoutAt: now },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/admin/users — delete all real (non-test) users
export async function DELETE(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const { count } = await prisma.user.deleteMany({ where: { isTestUser: false } });
  return NextResponse.json({ success: true, deleted: count });
}
