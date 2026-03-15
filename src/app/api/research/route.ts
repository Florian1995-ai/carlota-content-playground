import { NextRequest, NextResponse } from "next/server";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { url, topic, brandVoice } = await request.json();

    const systemPrompt = `You are a research assistant for Carlota Lopez-Peredo, a child development therapist with 15+ years of experience based in Spain. She helps parents, teachers, and educators support children with learning difficulties (reading, writing, attention, behavior, motor development, sensory integration).

CRITICAL CONTEXT — Carlota's expertise and audience:
- She works with families of children who struggle in school (reading delays, attention issues, behavioral challenges, motor immaturity)
- Her methods involve neurological and sensory-based therapeutic approaches
- Her audience: Spanish-speaking parents worried about their children's development, plus educators and therapists
- She runs individual sessions, parent training, and professional training courses
- Her website: carlotalopezperedo.es — "Brandium" is her course/content brand
- Content should be in SPANISH unless the user specifically requests English
- Topics should relate to: child development, neurodevelopment, sensory integration, learning difficulties, parenting strategies, educational psychology, motor development, attention/focus in children, reading/writing difficulties, emotional regulation in children

The brand voice is: ${brandVoice}.
- "Carlota Educator" = professional, evidence-based, aimed at teachers and therapists
- "Parents Community" = warm, empathetic, aimed at worried parents — reassuring but actionable
- "Brandium Courses" = course marketing focused on neurodevelopment training
- "Carlota Personal" = personal stories, thought leadership, behind-the-scenes

IMPORTANT: Research should focus on child development, neuroscience, pediatric therapy, educational psychology, and parenting — NEVER on social media marketing, Instagram tips, or content creation strategies. Carlota creates content ABOUT child development, she is NOT a social media expert.

You MUST respond with valid JSON only — no markdown, no code fences, no explanation outside the JSON. Use this exact structure:

{
  "topic": "string - the main topic title",
  "coreThesis": "string - 2-3 sentence thesis summarizing the cutting-edge perspective on this topic",
  "evidence": [
    {
      "finding": "string - the key finding or claim",
      "source": "string - shortened source name (e.g. 'PubMed - Smith et al. 2024')",
      "sourceUrl": "string - full URL to the source",
      "quality": "High" | "Moderate" | "Emerging"
    }
  ],
  "knowledgeBombs": [
    { "text": "string - a punchy, quotable insight suitable for social media, in Spanish" }
  ],
  "angles": [
    {
      "id": "string - unique id like angle_1",
      "title": "string - bold hook title for this angle, in Spanish",
      "mainstreamView": "string - what conventional wisdom says",
      "cuttingEdgeView": "string - the contrarian or cutting-edge take based on current research",
      "selected": false
    }
  ]
}

Requirements:
- Include 6-8 evidence items with real sources and URLs (prefer PubMed, NIH, peer-reviewed journals, UNICEF, WHO, recognized pediatric institutions)
- Include 6-8 knowledge bombs (quotable, punchy, one sentence each, in Spanish)
- Include 4-5 recommended angles, each with mainstream vs cutting-edge views
- Quality ratings: "High" for peer-reviewed/authoritative, "Moderate" for reliable secondary, "Emerging" for new/preliminary
- Make knowledge bombs parent-friendly — they should resonate with a worried parent scrolling social media
- Angles should challenge conventional parenting/education wisdom with evidence-based insights`;

    const userMessage = url
      ? `Research this content/topic from this URL: ${url}\n\nAdditional context: ${topic || "None"}`
      : `Research this topic thoroughly: ${topic}`;

    // Try Perplexity first (has web search), fall back to OpenRouter
    let rawContent: string | null = null;

    if (PERPLEXITY_API_KEY) {
      try {
        const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (perplexityResponse.ok) {
          const data = await perplexityResponse.json();
          rawContent = data.choices?.[0]?.message?.content;
        } else {
          console.log("Perplexity failed, falling back to OpenRouter");
        }
      } catch (e) {
        console.log("Perplexity error, falling back to OpenRouter:", e);
      }
    }

    // Fallback: OpenRouter with perplexity/sonar-pro or Claude
    if (!rawContent && OPENROUTER_API_KEY) {
      const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "perplexity/sonar-pro",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      if (!openrouterResponse.ok) {
        // Final fallback: use Claude via OpenRouter
        console.log("OpenRouter sonar-pro failed, trying Claude");
        const claudeResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage },
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (!claudeResponse.ok) {
          const errorText = await claudeResponse.text();
          console.error("All research APIs failed:", errorText);
          return NextResponse.json({ error: "All research APIs failed" }, { status: 502 });
        }

        const claudeData = await claudeResponse.json();
        rawContent = claudeData.choices?.[0]?.message?.content;
      } else {
        const data = await openrouterResponse.json();
        rawContent = data.choices?.[0]?.message?.content;
      }
    }

    if (!rawContent) {
      return NextResponse.json({ error: "No API keys configured or all failed" }, { status: 500 });
    }

    // Parse the JSON response - strip markdown fences if present
    let parsed;
    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse response:", rawContent.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse research results" }, { status: 502 });
    }

    // Clean up: strip markdown bold (**) from all string fields
    const stripMarkdown = (s: unknown): string =>
      typeof s === "string" ? s.replace(/\*\*/g, "").replace(/^['"]|['"]$/g, "").trim() : String(s || "");

    // Ensure angles have IDs and clean titles
    if (parsed.angles) {
      parsed.angles = parsed.angles.map((a: Record<string, unknown>, i: number) => ({
        ...a,
        title: stripMarkdown(a.title),
        mainstreamView: stripMarkdown(a.mainstreamView),
        cuttingEdgeView: stripMarkdown(a.cuttingEdgeView),
        id: a.id || `angle_${i + 1}`,
        selected: false,
      }));
    }

    // Clean knowledge bombs — filter out empty ones
    if (parsed.knowledgeBombs) {
      parsed.knowledgeBombs = parsed.knowledgeBombs
        .map((k: Record<string, unknown>) => ({ text: stripMarkdown(k.text) }))
        .filter((k: { text: string }) => k.text.length > 0);
    }

    // Clean topic title
    if (parsed.topic) {
      parsed.topic = stripMarkdown(parsed.topic);
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
