import { NextRequest, NextResponse } from "next/server";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Apify actor IDs
const YOUTUBE_TRANSCRIPT_ACTOR = "karamelo~youtube-transcripts";
const INSTAGRAM_SCRAPER_ACTOR = "apify~instagram-scraper";

async function runApifyActor(actorId: string, input: Record<string, unknown>): Promise<unknown[]> {
  if (!APIFY_API_TOKEN) throw new Error("APIFY_API_TOKEN not configured");

  // Start actor run and wait for it to finish
  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Apify actor ${actorId} failed:`, errorText);
    throw new Error(`Apify actor failed: ${response.status}`);
  }

  return response.json();
}

async function scrapeYouTube(url: string): Promise<string> {
  const items = await runApifyActor(YOUTUBE_TRANSCRIPT_ACTOR, {
    urls: [url],
    outputFormat: "singleStringText",
  }) as Array<{ transcript?: string; text?: string; title?: string; channelName?: string }>;

  if (!items || items.length === 0) {
    throw new Error("No transcript found");
  }

  const item = items[0];
  const transcript = item.transcript || item.text || "";
  const title = item.title || "";
  const channel = item.channelName || "";

  return `VIDEO TITLE: ${title}\nCHANNEL: ${channel}\nURL: ${url}\n\nTRANSCRIPT:\n${transcript}`;
}

async function scrapeWebsite(url: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Firecrawl scrape failed:", errorText);
    throw new Error(`Firecrawl scrape failed: ${response.status}`);
  }

  const data = await response.json();
  const markdown = data.data?.markdown || "";
  const title = data.data?.metadata?.title || "";
  const description = data.data?.metadata?.description || "";

  return `PAGE TITLE: ${title}\nDESCRIPTION: ${description}\nURL: ${url}\n\nCONTENT:\n${markdown}`;
}

async function scrapeInstagram(url: string): Promise<string> {
  const items = await runApifyActor(INSTAGRAM_SCRAPER_ACTOR, {
    directUrls: [url],
    resultsType: "posts",
    resultsLimit: 1,
    addParentData: false,
  }) as Array<{
    caption?: string;
    alt?: string;
    type?: string;
    likesCount?: number;
    commentsCount?: number;
    ownerUsername?: string;
    hashtags?: string[];
    timestamp?: string;
  }>;

  if (!items || items.length === 0) {
    throw new Error("No Instagram content found");
  }

  const item = items[0];
  const caption = item.caption || item.alt || "";
  const type = item.type || "unknown";
  const likes = item.likesCount || 0;
  const comments = item.commentsCount || 0;
  const username = item.ownerUsername || "";
  const hashtags = item.hashtags || [];

  return `INSTAGRAM POST by @${username}
TYPE: ${type}
LIKES: ${likes} | COMMENTS: ${comments}
HASHTAGS: ${hashtags.join(", ")}
URL: ${url}

CAPTION/CONTENT:
${caption}`;
}

export async function POST(request: NextRequest) {
  try {
    const { url, type } = await request.json();

    if (!url || !type) {
      return NextResponse.json({ error: "url and type are required" }, { status: 400 });
    }

    let content: string;

    if (type === "youtube") {
      content = await scrapeYouTube(url);
    } else if (type === "instagram") {
      content = await scrapeInstagram(url);
    } else if (type === "website") {
      content = await scrapeWebsite(url);
    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ content, type, url });
  } catch (error) {
    console.error("Scrape API error:", error);
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
