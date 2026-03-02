// src/app/api/authors/[name]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// Rename an author
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const body = await request.json();
    const { newName } = body;

    if (!newName || typeof newName !== "string" || !newName.trim()) {
      return NextResponse.json(
        { error: "New author name is required" },
        { status: 400 },
      );
    }

    const existingStories = await prisma.story.findMany({
      where: { author: decodedName },
    });

    if (existingStories.length === 0) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const result = await prisma.story.updateMany({
      where: { author: decodedName },
      data: { author: newName.trim() },
    });

    return NextResponse.json({
      success: true,
      message: "Author renamed successfully",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error renaming author:", error);
    return NextResponse.json(
      { error: "Failed to rename author" },
      { status: 500 },
    );
  }
}

// Delete an author
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const body = await request.json();
    const { deleteStories } = body;

    if (deleteStories === true) {
      // Delete all stories by this author (excluding placeholders)
      const result = await prisma.story.deleteMany({
        where: { author: decodedName },
      });

      return NextResponse.json({
        success: true,
        message: "Author and associated stories deleted",
        deletedStoriesCount: result.count,
      });
    } else {
      // Delete placeholder stories for this author
      await prisma.story.deleteMany({
        where: {
          author: decodedName,
          title: { startsWith: "__AUTHOR_PLACEHOLDER__" },
        },
      });

      // Set real stories to "Unknown Author"
      const result = await prisma.story.updateMany({
        where: {
          author: decodedName,
          NOT: { title: { startsWith: "__AUTHOR_PLACEHOLDER__" } },
        },
        data: { author: "Unknown Author" },
      });

      return NextResponse.json({
        success: true,
        message: "Author removed, stories set to Unknown Author",
        updatedStoriesCount: result.count,
      });
    }
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 },
    );
  }
}
