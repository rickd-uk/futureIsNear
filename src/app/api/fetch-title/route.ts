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

    // --- Title ---
    const ogTitle =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
    const twitterTitle =
      html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i)?.[1];
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    const h1Tag = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1];

    const rawTitle = (ogTitle || twitterTitle || titleTag || h1Tag)?.trim().replace(/\s+/g, " ");
    const title = rawTitle
      ?.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

    if (!title) {
      return NextResponse.json({ error: "No title found" }, { status: 404 });
    }

    // --- Description ---
    const ogDesc =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1];
    const metaDesc =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1];
    const twitterDesc =
      html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i)?.[1];

    // schema.org description from JSON-LD
    let schemaDesc: string | null = null;
    const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdBlocks) {
      for (const block of jsonLdBlocks) {
        try {
          const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
          const json = JSON.parse(inner);
          const entries = Array.isArray(json) ? json : [json];
          for (const entry of entries) {
            if (entry.description) { schemaDesc = entry.description; break; }
          }
          if (schemaDesc) break;
        } catch { /* malformed JSON-LD */ }
      }
    }

    const description = (ogDesc || metaDesc || twitterDesc || schemaDesc)?.trim().replace(/\s+/g, " ") || null;

    // --- Author ---
    let author: string | null = null;

    const articleAuthor =
      html.match(/<meta[^>]*(?:name|property)=["']article:author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']article:author["']/i)?.[1];
    if (articleAuthor) author = articleAuthor.trim();

    if (!author) {
      const metaAuthor =
        html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']author["']/i)?.[1];
      if (metaAuthor) author = metaAuthor.trim();
    }

    if (!author && jsonLdBlocks) {
      for (const block of jsonLdBlocks) {
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

    if (!author) {
      const parselyAuthor =
        html.match(/<meta[^>]*name=["']parsely-author["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']parsely-author["']/i)?.[1];
      if (parselyAuthor) author = parselyAuthor.trim();
    }

    if (!author) {
      const twitterCreator =
        html.match(/<meta[^>]*name=["']twitter:creator["'][^>]*content=["']([^"'@][^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"'@][^"']+)["'][^>]*name=["']twitter:creator["']/i)?.[1];
      if (twitterCreator) author = twitterCreator.trim();
    }

    if (!author) {
      const bylineSpan = html.match(/<(?:span|div|p)[^>]*class=["'][^"']*(?:byline|author|writer)[^"']*["'][^>]*>([^<]{2,80})<\/(?:span|div|p)>/i)?.[1];
      if (bylineSpan) author = bylineSpan.replace(/^by\s+/i, "").trim();
    }

    if (!author) {
      const relAuthor = html.match(/<a[^>]*rel=["']author["'][^>]*>([^<]{2,80})<\/a>/i)?.[1];
      if (relAuthor) author = relAuthor.trim();
    }

    // --- Published Date ---
    let publishedDate: string | null = null;

    const articlePublished =
      html.match(/<meta[^>]*(?:name|property)=["']article:published_time["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']article:published_time["']/i)?.[1];
    if (articlePublished) publishedDate = articlePublished.slice(0, 10);

    if (!publishedDate && jsonLdBlocks) {
      for (const block of jsonLdBlocks) {
        try {
          const inner = block.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
          const json = JSON.parse(inner);
          const entries = Array.isArray(json) ? json : [json];
          for (const entry of entries) {
            if (entry.datePublished) { publishedDate = String(entry.datePublished).slice(0, 10); break; }
          }
          if (publishedDate) break;
        } catch { /* malformed JSON-LD */ }
      }
    }

    return NextResponse.json({ title, author, description, publishedDate });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}
