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

    const raw = (ogTitle || titleTag)?.trim().replace(/\s+/g, " ");
    const title = raw?.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

    if (!title) {
      return NextResponse.json({ error: "No title found" }, { status: 404 });
    }

    // Author extraction — try multiple sources in priority order
    let author: string | null = null;

    // 1. article:author meta tag (both attribute orders)
    const articleAuthor =
      html.match(/<meta[^>]*(?:name|property)=["']article:author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']article:author["']/i)?.[1];
    if (articleAuthor) author = articleAuthor.trim();

    // 2. Standard author meta tag
    if (!author) {
      const metaAuthor =
        html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']author["']/i)?.[1];
      if (metaAuthor) author = metaAuthor.trim();
    }

    // 3. JSON-LD schema.org author (handles "name" or array of authors)
    if (!author) {
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatch) {
        for (const block of jsonLdMatch) {
          try {
            const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
            const json = JSON.parse(inner);
            const entries = Array.isArray(json) ? json : [json];
            for (const entry of entries) {
              const a = entry.author;
              if (!a) continue;
              const names = (Array.isArray(a) ? a : [a])
                .map((x: { name?: string } | string) => (typeof x === "string" ? x : x.name))
                .filter(Boolean);
              if (names.length > 0) { author = names.join(", "); break; }
            }
            if (author) break;
          } catch { /* malformed JSON-LD */ }
        }
      }
    }

    // 4. Parsely / other CMS tags
    if (!author) {
      const parselyAuthor =
        html.match(/<meta[^>]*name=["']parsely-author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']parsely-author["']/i)?.[1];
      if (parselyAuthor) author = parselyAuthor.trim();
    }

    return NextResponse.json({ title, author });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}
