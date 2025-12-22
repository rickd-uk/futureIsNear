import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET() {
  try {
    // Get all unique categories from stories
    const stories = await prisma.story.findMany({
      // where: {
      //   NOT: {
      //     author: "__SYSTEM__",
      //   },
      // },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    const categories = stories
      .map((story: { category: string | null }) => story.category)
      .filter(Boolean)
      .sort();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // CHECK AUTHENTICATION FIRST!
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { categoryName } = await request.json();

    if (
      !categoryName ||
      typeof categoryName !== "string" ||
      !categoryName.trim()
    ) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    // Check if category already exists
    const existingStory = await prisma.story.findFirst({
      where: {
        category: categoryName.trim(),
      },
    });

    if (existingStory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }

    // placeholder story to establish the category
    // This is a workaround since categories are derived from stories
    const placeholderStory = await prisma.story.create({
      data: {
        title: `__PLACEHOLDER__${categoryName.trim()}`,
        url: "about:blank",
        category: categoryName.trim(),
        description: "System placeholder - do not display",
        author: "__SYSTEM__",
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: categoryName.trim(),
      placeholderId: placeholderStory.id,
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
