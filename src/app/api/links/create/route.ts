// src/app/api/links/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/userAuth";

export async function POST(request: Request) {
  // Check for admin auth first
  const isAdmin = checkAuth(request);

  // If not admin, check for user auth
  const user = !isAdmin ? getUserFromRequest(request) : null;

  // Must be either admin or authenticated user
  if (!isAdmin && !user) {
    return unauthorizedResponse();
  }

  try {
    const {
      title,
      url,
      description,
      category,
      author,
      publicationMonth,
      publicationYear,
      makePublic,
    } = await request.json();

    // Validate required fields
    if (!title || !url || !category) {
      return NextResponse.json(
        { error: "Title, URL, and category are required" },
        { status: 400 },
      );
    }

    // Admin links are always public, user links respect makePublic preference
    const isPublic = isAdmin ? true : Boolean(makePublic);

    const newLink = await prisma.link.create({
      data: {
        title,
        url,
        description: description || null,
        category,
        author: author || "Unknown Author",
        timestamp: new Date(),
        publicationMonth: publicationMonth || null,
        publicationYear: publicationYear || null,
        isPublic,
        createdById: user?.userId || null,
      },
    });

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error("Error creating link:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 },
    );
  }
}
