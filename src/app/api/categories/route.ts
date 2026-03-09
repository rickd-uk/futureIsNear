import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includePrivate = searchParams.get("includePrivate") === "true";
    const withIcons = searchParams.get("withIcons") === "true";

    // Get categories from Category model (only public unless admin)
    const categoryWhere: Record<string, unknown> = {};

    if (includePrivate) {
      // Admin can see all
      if (!checkAuth(request)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    } else {
      // Default: only public categories
      categoryWhere.isPublic = true;
    }

    const categoriesFromModel = await prisma.category.findMany({
      where: categoryWhere,
      select: { name: true, icon: true },
      orderBy: { name: "asc" },
    });

    if (withIcons) {
      return NextResponse.json(categoriesFromModel);
    } else {
      return NextResponse.json(categoriesFromModel.map((c) => c.name));
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // Admin only - users cannot create categories
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const { categoryName, icon } = await request.json();

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

    const trimmedName = categoryName.trim();
    const categoryIcon = icon?.trim() || "📁";

    // Check if category already exists in Category model
    const existingCategory = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }

    // Create category in Category model (admin categories are always public)
    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        icon: categoryIcon,
        isPublic: true,
        createdById: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: newCategory.name,
      icon: newCategory.icon,
      id: newCategory.id,
      isPublic: newCategory.isPublic,
    });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
