import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { brief, angles, contentTypes, brandVoice } = await request.json();

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const selectedAngles = angles.length > 0
      ? angles.map((a: { title: string; cuttingEdgeView: string }) => `- ${a.title}: ${a.cuttingEdgeView}`).join("\n")
      : "Use the core thesis as the primary angle.";

    const evidenceSummary = brief.evidence
      .slice(0, 5)
      .map((e: { finding: string; source: string }) => `- ${e.finding} (${e.source})`)
      .join("\n");

    const knowledgeBombsSummary = brief.knowledgeBombs
      .slice(0, 5)
      .map((k: { text: string }) => `- "${k.text}"`)
      .join("\n");

    const typeInstructions: string[] = [];

    if (contentTypes.includes("talking_head")) {
      typeInstructions.push(`
WALKING TALKING HEAD REEL (generate 2 variations):
Carlota records these while walking outdoors — unedited, natural, phone in hand. NOT a teleprompter read.
For each, output a JSON object with:
- "type": "talking_head"
- "title": short title for the reel (in Spanish)
- "onScreenText": text overlay (max 8 words, punchy, in Spanish — e.g. "¿Tu hijo se atasca al leer?")
- "content": NOT a word-for-word script. Instead, provide BULLET POINTS she can glance at before recording:
  * GANCHO (first 3 seconds — question or surprising statement to stop the scroll)
  * PROBLEMA (what the parent is experiencing/feeling)
  * CLAVE (the key insight — ONE main idea, backed by evidence)
  * EJEMPLO (concrete example or metaphor from her clinical experience)
  * CIERRE + CTA (memorable line + "Si quieres saber más, escribe [KEYWORD] en los comentarios")
  Keep it to 5-7 bullet points max. She talks naturally from these, 30-60 seconds.
- "caption": Instagram caption in Spanish (2-3 sentences + CTA + relevant hashtags including #carlotalopezperedo #braingym #neurodesarrollo #dificultadesdeaprendizaje)
`);
    }

    if (contentTypes.includes("carousel")) {
      typeInstructions.push(`
EDUCATIONAL CAROUSEL (generate 1):
Carlota's carousels are informative — they explain learning difficulties, child development concepts, or parenting strategies.
Output a JSON object with:
- "type": "carousel"
- "title": carousel title (in Spanish, bold and direct)
- "content": the full carousel copy in Spanish, structured as:
  SLIDE 1: EL GANCHO
  On-screen text: [bold question or statement that hooks worried parents]
  Caption: [supporting text]

  SLIDE 2-7: CONTENIDO CLAVE
  On-screen text: [key point — short, bold]
  Caption: [explanation in simple terms a parent can understand]

  SLIDE 8: RESUMEN + CTA
  On-screen text: [takeaway message]
  Caption: [call to action — e.g. "Guarda este post y compártelo con quien lo necesite 💛" or "Escribe AYUDA en comentarios para más info"]

  Use 7-9 slides total. Each slide: on-screen text (short, bold) + caption (explanatory).
  Use emojis sparingly but naturally (🧠 💡 🌱 ✨ 💛 — her style).
- "caption": Instagram caption in Spanish (include CTA keyword + hashtags)
`);
    }

    const prompt = `You are writing content for Carlota Lopez-Peredo, a child development therapist based in Spain with 15+ years of experience.

CARLOTA'S TONE OF VOICE (extracted from her real Instagram posts):
- Warm, maternal, empathetic — she speaks directly to worried parents: "Si te encuentras que tu hijo tiene dificultades..."
- Uses "tu hij@" (inclusive gender), "peque", "pequeñ@"
- Mixes professional knowledge with emotional reassurance: "dejas de ver problemas y empiezas a ver procesos 🌱"
- Casual but authoritative — she's the expert friend, not the distant doctor
- Often starts with a question: "¿Sabías que...?", "¿Notas que tu hijo...?"
- Uses emojis naturally: 🧠 💡 🌱 ✨ 💛 🤗 👋 🎓 but not excessively
- Speaks from clinical experience: "En mi consulta veo...", "Después de 15 años trabajando con familias..."
- Always empowering: "YO PUEDO" is her core message for kids
- Key topics: Brain Gym, lateralidad, funciones ejecutivas, lectoescritura, integración sensorial, desarrollo motor
- CTA style: "Escribe [KEYWORD] y te mando la info" or "Comenta [WORD] si quieres saber más"

CONTENT MUST BE IN SPANISH.

Brand voice: ${brandVoice}
${brandVoice === "Carlota Educator" ? "→ More professional, evidence-based, aimed at teachers/therapists. Less emojis, more citations." : ""}
${brandVoice === "Parents Community" ? "→ Warm, reassuring, aimed at worried parents. More empathy, practical tips, emotional connection." : ""}
${brandVoice === "Brandium Courses" ? "→ Course promotion focused on transformation. Success stories, urgency, community building." : ""}
${brandVoice === "Carlota Personal" ? "→ Personal stories, behind-the-scenes, vulnerability. Her journey, her why, her celebrations." : ""}

RESEARCH BRIEF:
Topic: ${brief.topic}
Core Thesis: ${brief.coreThesis}

Key Evidence:
${evidenceSummary}

Knowledge Bombs:
${knowledgeBombsSummary}

Selected Angles:
${selectedAngles}

REEL BEST PRACTICES (for talking head):
- Hook in first 2 seconds (question or bold statement)
- ONE idea per reel — don't try to cover everything
- Talk like you're explaining to a friend at the park
- End with a clear CTA: "Escribe [KEYWORD] en comentarios"
- 30-60 seconds max (150-250 words spoken)
- Best performers are walking outdoors, natural lighting, no editing

TASK: Generate the following content types based on this research.

${typeInstructions.join("\n")}

IMPORTANT: Respond with ONLY a valid JSON object with this structure:
{
  "content": [
    {
      "type": "talking_head" | "carousel",
      "title": "string",
      "onScreenText": "string (for talking_head only)",
      "content": "string - bullet points for talking head, or slide-by-slide for carousel",
      "caption": "string"
    }
  ]
}

No markdown fences, no explanation outside the JSON.`;

    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json({ error: "OpenRouter API failed" }, { status: 502 });
    }

    const openrouterData = await openrouterResponse.json();
    const rawContent = openrouterData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "No content from OpenRouter" }, { status: 502 });
    }

    let parsed;
    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Anthropic response:", rawContent);
      return NextResponse.json({ error: "Failed to parse generated content" }, { status: 502 });
    }

    // Add IDs and metadata to each content piece
    const content = parsed.content.map((piece: Record<string, unknown>, i: number) => ({
      ...piece,
      id: `content_${Date.now()}_${i}`,
      status: "draft",
      approved: false,
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
