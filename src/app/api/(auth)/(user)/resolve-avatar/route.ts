import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic URL validation
    let targetUrl: URL;
    try {
      targetUrl = new URL(url.trim());
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Fetch the URL to resolve redirects and get page HTML
    let html = "";
    let resolvedUrl = targetUrl.toString();
    let fetchOk = false;

    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (response.ok) {
        html = await response.text();
        resolvedUrl = response.url;
        fetchOk = true;
      }
    } catch (err) {
      console.warn("Standard fetch failed:", err);
    }

    // Extract image metadata URL
    let imageUrl: string | null = null;
    
    if (fetchOk && html) {
      // Match property="og:image" content="..."
      let match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (!match) {
        // Try reversed order: content="..." property="og:image"
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      }
      if (!match) {
        // Try twitter:image
        match = html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        // Try reversed twitter:image
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image:secure_url["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*itemprop=["']image["']/i);
      }
      if (!match) {
        match = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']image_src["']/i);
      }

      if (match && match[1]) {
        imageUrl = match[1];
      } else {
        // Fallback: check schema.jsonld contentUrl if Pinterest
        const jsonMatch = html.match(/"contentUrl"\s*:\s*"([^"]+)"/);
        if (jsonMatch) {
          imageUrl = jsonMatch[1];
        }
      }

      // Resolve relative paths
      if (imageUrl && imageUrl.startsWith("/")) {
        const origin = new URL(resolvedUrl).origin;
        imageUrl = `${origin}${imageUrl}`;
      }
    }

    // Fallback to Microlink API if standard parsing failed or page request was blocked
    if (!imageUrl) {
      try {
        const microLinkUrl = `https://api.microlink.io?url=${encodeURIComponent(targetUrl.toString())}`;
        const microRes = await fetch(microLinkUrl);
        if (microRes.ok) {
          const microData = await microRes.json();
          if (microData?.status === "success" && microData?.data?.image?.url) {
            imageUrl = microData.data.image.url;
          } else if (microData?.status === "success" && microData?.data?.logo?.url) {
            imageUrl = microData.data.logo.url;
          }
        }
      } catch (microErr) {
        console.error("Microlink fallback failed:", microErr);
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Could not find a preview image on the page" }, { status: 404 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in resolve-avatar route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
