import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const links = await prisma.link.findMany({
      orderBy: {
        timestamp: "desc",
      },
    });

    return NextResponse.json(links);
  } catch (err) {
    console.error("Failed to fetch links:", err);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 },
    );
  }
}
