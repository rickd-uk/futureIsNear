import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

export async function DELETE(request: Request) {
  // CHECK AUTHENTICATION FIRST!
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const result = await prisma.story.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} stories`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error clearing stories:", error);
    return NextResponse.json(
      { error: "Failed to clear stories" },
      { status: 500 },
    );
  }
}
