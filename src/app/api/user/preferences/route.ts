import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, userUnauthorizedResponse } from "@/lib/userAuth";

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return userUnauthorizedResponse();

  const record = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { preferences: true },
  });

  try {
    return NextResponse.json(JSON.parse(record?.preferences ?? "{}"));
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return userUnauthorizedResponse();

  const body = await request.json();

  // Fetch existing prefs and merge
  const record = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { preferences: true },
  });
  const existing = JSON.parse(record?.preferences ?? "{}");
  const merged = { ...existing, ...body };

  await prisma.user.update({
    where: { id: user.userId },
    data: { preferences: JSON.stringify(merged) },
  });

  return NextResponse.json(merged);
}
