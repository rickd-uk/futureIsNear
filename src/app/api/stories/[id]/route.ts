import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.story.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // only include valid story fields
    const updateData: {
      title?: string;
      url?: string;
      category?: string;
      description?: string | null;
      author?: string | null;
      publicationMonth?: number | null;
      publicationYear?: number | null;
    } = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.author !== undefined) updateData.author = body.author;
    if (body.publicationMonth !== undefined)
      updateData.publicationMonth = body.publicationMonth;
    if (body.publicationYear !== undefined)
      updateData.publicationYear = body.publicationYear;

    const updatedStory = await prisma.story.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error("Error updating story:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 },
    );
  }
}
