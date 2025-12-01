// src/app/api/stories/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      title,
      url,
      description,
      category,
      author,
      publicationMonth,
      publicationYear,
    } = await request.json();

    // Validate required fields
    if (!title || !url || !category) {
      return NextResponse.json(
        { error: "Title, URL, and category are required" },
        { status: 400 },
      );
    }

    const newStory = await prisma.story.create({
      data: {
        title,
        url,
        description: description || null,
        category,
        author: author || "Unknown Author",
        timestamp: new Date(),
        publicationMonth: publicationMonth || null,
        publicationYear: publicationYear || null,
      },
    });

    return NextResponse.json(newStory, { status: 201 });
  } catch (error) {
    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 },
    );
  }
}
