import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHotScore } from "@/lib/votingConfig";
import { getUserFromRequest } from "@/lib/userAuth";
import { checkAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "hot";
    const mine = searchParams.get("mine") === "true";
    const includePrivate = searchParams.get("includePrivate") === "true";

    // Check if user is authenticated
    const user = getUserFromRequest(request);

    // Build where clause
    let whereClause: Record<string, unknown> = {
      NOT: [
        { author: "__SYSTEM__" },
        { title: { startsWith: "__AUTHOR_PLACEHOLDER__" } },
        { title: { startsWith: "__PLACEHOLDER__" } },
      ],
    };

    // If requesting only user's own links
    if (mine) {
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      whereClause.createdById = user.userId;
    } else if (includePrivate) {
      // Admin can see all links
      if (!checkAuth(request)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
      // No filter - show all
    } else {
      // Default: show public links + user's own private links
      if (user) {
        // Authenticated: public OR own links
        whereClause = {
          AND: [
            {
              NOT: [
                { author: "__SYSTEM__" },
                { title: { startsWith: "__AUTHOR_PLACEHOLDER__" } },
                { title: { startsWith: "__PLACEHOLDER__" } },
              ],
            },
            {
              OR: [
                { isPublic: true },
                { createdById: user.userId },
              ],
            },
          ],
        };
      } else {
        // Not authenticated: only public links
        whereClause.isPublic = true;
      }
    }

    const links = await prisma.link.findMany({
      where: whereClause,
      include: {
        votes: {
          select: {
            count: true,
          },
        },
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    // Calculate totalVotes and hotScore for each link
    const linksWithScores = links.map((link) => {
      const totalVotes = link.votes.reduce((sum, v) => sum + v.count, 0);
      const hotScore = calculateHotScore(
        totalVotes,
        link.boost,
        new Date(link.timestamp)
      );

      return {
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        category: link.category,
        author: link.author,
        timestamp: link.timestamp,
        publicationMonth: link.publicationMonth,
        publicationYear: link.publicationYear,
        boost: link.boost,
        isPublic: link.isPublic,
        createdById: link.createdById,
        submittedBy: link.createdBy?.username || null,
        totalVotes,
        hotScore,
      };
    });

    // Sort based on query param
    if (sort === "newest") {
      linksWithScores.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else {
      // Default: sort by hot score
      linksWithScores.sort((a, b) => b.hotScore - a.hotScore);
    }

    return NextResponse.json(linksWithScores);
  } catch (error) {
    console.error("Failed to fetch links:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    );
  }
}
