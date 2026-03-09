import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(request: Request) {
  // CHECK AUTHENTICATION FIRST!
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const result = await prisma.link.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} links`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error clearing links:", error);
    return NextResponse.json(
      { error: "Failed to clear links" },
      { status: 500 },
    );
  }
}
