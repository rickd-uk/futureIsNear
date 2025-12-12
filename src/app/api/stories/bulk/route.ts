import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";

// Define required CSV fields
interface CSVStory {
  title: string;
  url: string;
  category: string;
  description?: string;
  author?: string;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // CHECK AUTHENTICATION FIRST!
  if (!checkAuth(request)) {
    return unauthorizedResponse();
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 },
      );
    }

    // Read the file content
    const csvText = await file.text();
    console.log("CSV Content preview:", csvText.substring(0, 100));

    // Parse CSV
    const parseResult = Papa.parse<CSVStory>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.error("Parse errors:", parseResult.errors);
      return NextResponse.json(
        { error: "CSV parsing failed", details: parseResult.errors },
        { status: 400 },
      );
    }

    const stories = parseResult.data;
    console.log("Parsed stories:", stories.length);

    // Validate required fields
    const invalidStories = stories.filter((story) => {
      return !story.title || !story.url || !story.category;
    });

    if (invalidStories.length > 0) {
      console.log("Invalid stories:", invalidStories);
      return NextResponse.json(
        {
          error: "Invalid data in CSV",
          details:
            "Some stories are missing required fields (title, url, category)",
        },
        { status: 400 },
      );
    }

    // Insert stories into the database
    let inserted = 0;
    for (const story of stories) {
      try {
        await prisma.story.create({
          data: {
            title: story.title.trim(),
            url: story.url.trim(),
            category: story.category.trim(),
            description: story.description?.trim() || "No description provided",
            author: story.author?.trim() || "Unknown Author", // Default if missing
            timestamp: new Date(), // Default to current date/time
          },
        });
        inserted++;
      } catch (err) {
        console.error("Error inserting story:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${inserted} stories out of ${stories.length} total`,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to process bulk upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
