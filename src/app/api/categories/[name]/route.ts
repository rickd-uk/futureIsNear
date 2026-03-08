import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// Update a category (rename and/or change icon)
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
    const { newName, icon } = body;

    // Find category in Category model
    const existingCategory = await prisma.category.findUnique({
      where: { name: decodedName },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const updateData: { name?: string; icon?: string } = {};
    if (newName && newName.trim() && newName.trim() !== decodedName) {
      updateData.name = newName.trim();
    }
    if (icon !== undefined) {
      updateData.icon = icon.trim() || "📁";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes made",
        updatedCount: 0,
      });
    }

    // Update category in Category model
    await prisma.category.update({
      where: { name: decodedName },
      data: updateData,
    });

    // If name changed, update all stories with the old category name
    let storiesUpdated = 0;
    if (updateData.name) {
      const result = await prisma.story.updateMany({
        where: { category: decodedName },
        data: { category: updateData.name },
      });
      storiesUpdated = result.count;
    }

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      updatedCount: storiesUpdated,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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

    // Delete from Category model
    await prisma.category.delete({
      where: { name: decodedName },
    }).catch(() => {
      // Category might not exist in model (legacy)
    });

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
