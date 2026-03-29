import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAuth } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/userAuth";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(request: Request) {
  const isAdmin = checkAuth(request);
  const user = !isAdmin ? getUserFromRequest(request) : null;

  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: {
    url?: string;
    title?: string;
    description?: string;
    author?: string;
    categories?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, title, description, author, categories = [] } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const metaLines = [
    `URL: ${url}`,
    title ? `Title: ${title}` : null,
    description ? `Description: ${description}` : null,
    author ? `Author: ${author}` : null,
  ].filter(Boolean).join("\n");

  const categoryList = categories.length > 0 ? categories.join(", ") : "none provided";

  const prompt = `You are a link metadata assistant. Given extracted webpage metadata, return a JSON object.

Metadata:
${metaLines}

Available categories: ${categoryList}

Rules:
- Return ONLY a raw JSON object, no markdown, no explanation
- title: clean readable title (improve if overly long or includes site name suffix)
- description: 1-2 sentence summary of the content. null if insufficient info
- author: person or organisation name. null if uncertain
- category: pick exactly one from the available categories list, or null if none fits

JSON shape: {"title": "...", "description": "...", "author": "...", "category": "..."}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Strip any accidental markdown fences
    const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    let result: { title?: string; description?: string; author?: string; category?: string };
    try {
      result = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    return NextResponse.json({
      title: typeof result.title === "string" ? result.title : null,
      description: typeof result.description === "string" ? result.description : null,
      author: typeof result.author === "string" ? result.author : null,
      category: typeof result.category === "string" ? result.category : null,
    });
  } catch (err) {
    console.error("AI lookup error:", err);
    return NextResponse.json({ error: "AI lookup failed" }, { status: 500 });
  }
}
