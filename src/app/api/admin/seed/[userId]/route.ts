import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// DELETE /api/admin/seed/[userId] — delete a single test user and their links
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const { userId } = await params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.isTestUser) return NextResponse.json({ error: "Not a test user" }, { status: 400 });

  await prisma.link.deleteMany({ where: { createdById: userId } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
