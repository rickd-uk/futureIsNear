import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, userUnauthorizedResponse } from "@/lib/userAuth";
import { MAX_VOTES_PER_STORY, DAILY_VOTE_BUDGET } from "@/lib/votingConfig";

// GET - Get user's votes and remaining daily budget
export async function GET(request: Request) {
  const user = getUserFromRequest(request);

  if (!user) {
    return userUnauthorizedResponse();
  }

  try {
    // Get all votes by this user
    const votes = await prisma.vote.findMany({
      where: { userId: user.userId },
      select: {
        storyId: true,
        count: true,
        createdAt: true,
      },
    });

    // Calculate remaining budget for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVotes = votes.filter((v) => new Date(v.createdAt) >= today);
    const usedBudget = todayVotes.reduce((sum, v) => sum + v.count, 0);
    const remainingBudget = Math.max(0, DAILY_VOTE_BUDGET - usedBudget);

    return NextResponse.json({
      votes: votes.map((v) => ({ storyId: v.storyId, count: v.count })),
      remainingBudget,
      usedBudget,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

// POST - Add/update vote on a story
export async function POST(request: Request) {
  const user = getUserFromRequest(request);

  if (!user) {
    return userUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { storyId, count } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    if (!count || count < 1 || count > MAX_VOTES_PER_STORY) {
      return NextResponse.json(
        { error: `Vote count must be between 1 and ${MAX_VOTES_PER_STORY}` },
        { status: 400 }
      );
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Get existing vote for this story
    const existingVote = await prisma.vote.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: user.userId,
        },
      },
    });

    // Calculate today's used budget
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVotes = await prisma.vote.findMany({
      where: {
        userId: user.userId,
        createdAt: { gte: today },
      },
    });

    const currentUsedBudget = todayVotes.reduce((sum, v) => sum + v.count, 0);
    const existingCount = existingVote?.count || 0;

    // Calculate the additional votes needed
    const additionalVotes = count - existingCount;

    // Check if user has enough budget
    if (additionalVotes > 0) {
      const remainingBudget = DAILY_VOTE_BUDGET - currentUsedBudget;
      if (additionalVotes > remainingBudget) {
        return NextResponse.json(
          {
            error: `Not enough daily budget. You have ${remainingBudget} votes remaining today.`,
            remainingBudget,
          },
          { status: 400 }
        );
      }
    }

    // Create or update vote
    if (existingVote) {
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { count },
      });
    } else {
      await prisma.vote.create({
        data: {
          storyId,
          userId: user.userId,
          count,
        },
      });
    }

    // Calculate new remaining budget
    const newUsedBudget = currentUsedBudget + additionalVotes;
    const newRemainingBudget = Math.max(0, DAILY_VOTE_BUDGET - newUsedBudget);

    return NextResponse.json({
      success: true,
      newCount: count,
      remainingBudget: newRemainingBudget,
    });
  } catch (error) {
    console.error("Error adding vote:", error);
    return NextResponse.json(
      { error: "Failed to add vote" },
      { status: 500 }
    );
  }
}

// DELETE - Remove vote from a story
export async function DELETE(request: Request) {
  const user = getUserFromRequest(request);

  if (!user) {
    return userUnauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("storyId");

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Delete the vote
    const deletedVote = await prisma.vote.deleteMany({
      where: {
        storyId,
        userId: user.userId,
      },
    });

    if (deletedVote.count === 0) {
      return NextResponse.json(
        { error: "Vote not found" },
        { status: 404 }
      );
    }

    // Recalculate remaining budget
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVotes = await prisma.vote.findMany({
      where: {
        userId: user.userId,
        createdAt: { gte: today },
      },
    });

    const usedBudget = todayVotes.reduce((sum, v) => sum + v.count, 0);
    const remainingBudget = Math.max(0, DAILY_VOTE_BUDGET - usedBudget);

    return NextResponse.json({
      success: true,
      remainingBudget,
    });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
