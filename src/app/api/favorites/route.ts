import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// Get user identifier (IP address for now)
async function getUserId() {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : headersList.get("x-real-ip") || "unknown";
  return `user_${ip}`;
}

// GET - Get all favorites for current user
export async function GET() {
  try {
    const userId = await getUserId();

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },
      select: {
        storyId: true,
      },
    });

    const favoriteIds = favorites.map((f) => f.storyId);

    return NextResponse.json({ favoriteIds });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 },
    );
  }
}

// POST - Add a favorite
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 },
      );
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        message: "Already favorited",
        favorited: true,
      });
    }

    // Create favorite
    await prisma.favorite.create({
      data: {
        storyId,
        userId,
      },
    });

    return NextResponse.json({
      message: "Favorite added",
      favorited: true,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a favorite
export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        storyId,
        userId,
      },
    });

    return NextResponse.json({
      message: "Favorite removed",
      favorited: false,
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 },
    );
  }
}
