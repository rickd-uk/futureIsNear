// src/app/api/authors/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    const links = await prisma.link.findMany({
      select: { author: true },
      distinct: ["author"],
      where: {
        author: { not: null },
        NOT: [{ author: "__SYSTEM__" }, { author: "Unknown Author" }],
      },
    });

    const authors = links
      .map((link: { author: string | null }) => link.author!)
      .filter((author: string) => author !== "Unknown Author")
      .sort((a: string, b: string) => a.localeCompare(b));

    return NextResponse.json(authors);
  } catch (error) {
    console.error("Failed to fetch authors:", error);
    return NextResponse.json(
      { error: "Failed to fetch authors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { authorName } = await request.json();

    if (!authorName || typeof authorName !== "string" || !authorName.trim()) {
      return NextResponse.json(
        { error: "Author name is required" },
        { status: 400 },
      );
    }

    const trimmed = authorName.trim();

    // Check if author already exists
    const existing = await prisma.link.findFirst({
      where: { author: trimmed },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Author already exists" },
        { status: 400 },
      );
    }

    // Placeholder link to establish the author
    await prisma.link.create({
      data: {
        title: `__AUTHOR_PLACEHOLDER__${trimmed}`,
        url: "about:blank",
        category: "Uncategorized",
        description: "System placeholder - do not display",
        author: trimmed,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Author created successfully",
      author: trimmed,
    });
  } catch (error) {
    console.error("Failed to create author:", error);
    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 },
    );
  }
}
