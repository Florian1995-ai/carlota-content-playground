import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { currentContent, message, history } = await request.json();

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const messages = [
      {
        role: "user" as const,
        content: `You are an editor assistant for Carlota Lopez-Peredo, a child development therapist in Spain. All content should be in SPANISH.

Carlota's tone: warm, maternal, empathetic. She uses "tu hij@", "peque", "pequeñ@". She's the expert friend — casual but authoritative. Uses emojis naturally (🧠 💡 🌱 ✨ 💛) but not excessively. Speaks from clinical experience. Key topics: Brain Gym, lateralidad, funciones ejecutivas, lectoescritura, integración sensorial.

For walking reels: she needs BULLET POINTS not full scripts. She talks naturally while walking outdoors.
For carousels: educational, informative, slide-by-slide format.
Always include a CTA: "Escribe [KEYWORD] en los comentarios" or "Guarda este post".

Here is the current content being edited:

---
${currentContent}
---

The user wants to make changes or ask questions about this content. Respond helpfully.

If they ask you to modify the content, include the full updated content in your response wrapped in <updated_content>...</updated_content> tags. If they just ask a question, answer it without those tags.

Previous conversation:
${history.map((h: { role: string; text: string }) => `${h.role}: ${h.text}`).join("\n")}

User's new message: ${message}`,
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 2000,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json({ error: "OpenRouter API failed" }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "No response from OpenRouter" }, { status: 502 });
    }

    // Check if the response includes updated content
    const updatedContentMatch = rawContent.match(/<updated_content>([\s\S]*?)<\/updated_content>/);
    const updatedContent = updatedContentMatch ? updatedContentMatch[1].trim() : null;

    // Strip the tags from the reply shown to the user
    const reply = rawContent
      .replace(/<updated_content>[\s\S]*?<\/updated_content>/, "")
      .trim();

    return NextResponse.json({
      reply: reply || "Content has been updated.",
      updatedContent,
    });
  } catch (error) {
    console.error("Edit chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
