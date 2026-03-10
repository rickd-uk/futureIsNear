import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/userAuth";

// GET /api/links/trash — list all soft-deleted links for the current user (+ count)
export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("countOnly") === "true";

  if (countOnly) {
    const count = await prisma.link.count({
      where: { createdById: user.userId, deletedAt: { not: null } },
    });
    return NextResponse.json({ count });
  }

  const links = await prisma.link.findMany({
    where: { createdById: user.userId, deletedAt: { not: null } },
    select: {
      id: true, title: true, url: true, category: true,
      author: true, timestamp: true, deletedAt: true,
    },
    orderBy: { deletedAt: "desc" },
  });

  return NextResponse.json({ links, count: links.length });
}

// DELETE /api/links/trash — permanently delete trash items
// Body: { ids: string[] } to delete specific items, or { all: true } to empty bin
export async function DELETE(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body.all) {
    await prisma.link.deleteMany({
      where: { createdById: user.userId, deletedAt: { not: null } },
    });
    return NextResponse.json({ success: true });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.link.deleteMany({
      where: { createdById: user.userId, deletedAt: { not: null }, id: { in: body.ids } },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide ids or all:true" }, { status: 400 });
}

// PATCH /api/links/trash — restore items from trash
// Body: { ids: string[] } or { all: true }
export async function PATCH(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  if (body.all) {
    await prisma.link.updateMany({
      where: { createdById: user.userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return NextResponse.json({ success: true });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await prisma.link.updateMany({
      where: { createdById: user.userId, deletedAt: { not: null }, id: { in: body.ids } },
      data: { deletedAt: null },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide ids or all:true" }, { status: 400 });
}
