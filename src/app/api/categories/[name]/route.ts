import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// Rename a category
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
        { error: "New category name is required" },
        { status: 400 },
      );
    }
    // Check if the new category name already exists
    const existingStories = await prisma.story.findMany({
      where: {
        category: decodedName,
      },
    });
    if (existingStories.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }
    // Update all stories with the old category name to the new name
    const result = await prisma.story.updateMany({
      where: {
        category: decodedName,
      },
      data: {
        category: newName.trim(),
      },
    });
    return NextResponse.json({
      success: true,
      message: "Category renamed successfully",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error renaming category:", error);
    return NextResponse.json(
      { error: "Failed to rename category" },
      { status: 500 },
    );
  }
}

// Delete a category
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
      // Delete all stories with this category
      const result = await prisma.story.deleteMany({
        where: {
          category: decodedName,
        },
      });
      return NextResponse.json({
        success: true,
        message: "Category and associated stories deleted",
        deletedStoriesCount: result.count,
      });
    } else {
      // Delete placeholder stories for this category
      await prisma.story.deleteMany({
        where: {
          category: decodedName,
          author: "__SYSTEM__",
          title: { startsWith: "__PLACEHOLDER__" },
        },
      });

      // Set category to "Uncategorized" for real stories only
      const result = await prisma.story.updateMany({
        where: {
          category: decodedName,
          NOT: {
            author: "__SYSTEM__",
          },
        },
        data: {
          category: "Uncategorized",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Category removed, stories set to Uncategorized",
        updatedStoriesCount: result.count,
      });
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
