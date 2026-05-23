export async function resolveImageLink(urlStr: string): Promise<string | null> {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim();
  if (!trimmed) return null;

  // Dicebear and special URLs are always resolved/valid
  if (trimmed.includes("api.dicebear.com") || trimmed.startsWith("data:image/") || trimmed.startsWith("/")) {
    return trimmed;
  }

  // Basic validation
  try {
    new URL(trimmed);
  } catch {
    return null;
  }

  // If it already ends with a standard image extension, verify it's active
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(trimmed, { method: "HEAD", signal: controller.signal });
      clearTimeout(id);
      if (res.status >= 200 && res.status < 400) {
        return trimmed;
      }
    } catch {
      // If HEAD fails, try a quick GET
      try {
        const getController = new AbortController();
        const getId = setTimeout(() => getController.abort(), 3000);
        const res = await fetch(trimmed, { 
          method: "GET", 
          signal: getController.signal,
          headers: { 'Range': 'bytes=0-0' }
        });
        clearTimeout(getId);
        if (res.status >= 200 && res.status < 400) {
          return trimmed;
        }
      } catch {}
    }
  }

  // Otherwise, run standard HTML og:image resolving (like in resolve-avatar route)
  try {
    const response = await fetch(trimmed, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.startsWith("image/")) {
        return response.url; // Already direct image
      }

      const html = await response.text();
      const resolvedUrl = response.url;

      // Extract image tags
      let match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      if (!match) {
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<meta[^>]*itemprop=["']image["'][^>]*content=["']([^"']+)["']/i);
      }
      if (!match) {
        match = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
      }

      let imageUrl: string | null = null;
      if (match && match[1]) {
        imageUrl = match[1];
      } else {
        const jsonMatch = html.match(/"contentUrl"\s*:\s*"([^"]+)"/);
        if (jsonMatch) imageUrl = jsonMatch[1];
      }

      if (imageUrl) {
        if (imageUrl.startsWith("/")) {
          const origin = new URL(resolvedUrl).origin;
          imageUrl = `${origin}${imageUrl}`;
        }
        return imageUrl;
      }
    }
  } catch (err) {
    console.warn("Standard resolving failed:", err);
  }

  // Try Microlink API as final fallback
  try {
    const microLinkUrl = `https://api.microlink.io?url=${encodeURIComponent(trimmed)}`;
    const microRes = await fetch(microLinkUrl);
    if (microRes.ok) {
      const microData = await microRes.json();
      if (microData?.status === "success" && microData?.data?.image?.url) {
        return microData.data.image.url;
      } else if (microData?.status === "success" && microData?.data?.logo?.url) {
        return microData.data.logo.url;
      }
    }
  } catch (microErr) {
    console.error("Microlink fallback failed:", microErr);
  }

  return null;
}
