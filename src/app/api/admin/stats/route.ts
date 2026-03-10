import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);

  const [realUsers, activeToday, totalLinks, publicLinks, totalVotes, totalUsers] = await Promise.all([
    prisma.user.count({ where: { isTestUser: false } }),
    prisma.user.count({ where: { isTestUser: false, lastSeenAt: { gte: since } } }),
    prisma.link.count({ where: { deletedAt: null } }),
    prisma.link.count({ where: { deletedAt: null, isPublic: true } }),
    prisma.vote.count(),
    prisma.user.count(),
  ]);

  return NextResponse.json({ realUsers, activeToday, totalLinks, publicLinks, totalVotes, totalUsers });
}
