import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinX/1.0; +https://linx.app)" },
      signal: AbortSignal.timeout(6000),
    });

    const html = await response.text();

    // Try og:title first (handles both attribute orders)
    const ogTitle =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];

    // Fall back to <title>
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    const title = (ogTitle || titleTag)?.trim().replace(/\s+/g, " ");

    if (!title) {
      return NextResponse.json({ error: "No title found" }, { status: 404 });
    }

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}
