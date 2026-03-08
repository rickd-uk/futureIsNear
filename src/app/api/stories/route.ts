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

    // If requesting only user's own stories
    if (mine) {
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      whereClause.createdById = user.userId;
    } else if (includePrivate) {
      // Admin can see all stories
      if (!checkAuth(request)) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
      // No filter - show all
    } else {
      // Default: show public stories + user's own private stories
      if (user) {
        // Authenticated: public OR own stories
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
        // Not authenticated: only public stories
        whereClause.isPublic = true;
      }
    }

    const stories = await prisma.story.findMany({
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

    // Calculate totalVotes and hotScore for each story
    const storiesWithScores = stories.map((story) => {
      const totalVotes = story.votes.reduce((sum, v) => sum + v.count, 0);
      const hotScore = calculateHotScore(
        totalVotes,
        story.boost,
        new Date(story.timestamp)
      );

      return {
        id: story.id,
        title: story.title,
        url: story.url,
        description: story.description,
        category: story.category,
        author: story.author,
        timestamp: story.timestamp,
        publicationMonth: story.publicationMonth,
        publicationYear: story.publicationYear,
        boost: story.boost,
        isPublic: story.isPublic,
        createdById: story.createdById,
        submittedBy: story.createdBy?.username || null,
        totalVotes,
        hotScore,
      };
    });

    // Sort based on query param
    if (sort === "newest") {
      storiesWithScores.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else {
      // Default: sort by hot score
      storiesWithScores.sort((a, b) => b.hotScore - a.hotScore);
    }

    return NextResponse.json(storiesWithScores);
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
