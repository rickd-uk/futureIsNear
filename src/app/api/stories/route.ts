import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateHotScore } from "@/lib/votingConfig";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "hot";

    const stories = await prisma.story.findMany({
      where: {
        NOT: [
          { author: "__SYSTEM__" },
          { title: { startsWith: "__AUTHOR_PLACEHOLDER__" } },
          { title: { startsWith: "__PLACEHOLDER__" } },
        ],
      },
      include: {
        votes: {
          select: {
            count: true,
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
