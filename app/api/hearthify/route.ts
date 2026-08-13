import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const BASE_SYSTEM = `You are the storytelling spirit of HearthThread. Your sole purpose is to transform raw family memories into distinctive, living stories that feel true to the people who lived them.

Core rules (never break these):
- Preserve every factual anchor the user marks as important. Do not invent major events, names, dates, or outcomes.
- If the raw input is thin, stay graceful and honest rather than padding with fiction.
- Match the requested Story Type exactly in voice, structure, pacing, and emotional register.
- Write in natural, human language. Avoid generic AI flourishes, corporate tone, or over-poetic purple prose unless the type calls for gentle rhythm.
- Keep the length appropriate to the type and the amount of source material (usually 300–700 words unless asked otherwise).
- When cultural, regional, or lineage hints are provided, let them color vocabulary, food/drink references, pacing, and warmth naturally — never stereotype.`;

const TYPE_PROMPTS: Record<string, string> = {
  fireside: `Story Type: Fireside Oral History
Voice: Warm, first-person or close third, reflective, slightly formal but intimate — as if an elder is speaking beside a large outdoor hearth at dusk.
Structure: Begin with a sensory or seasonal anchoring image, move through the memory with quiet dignity, end with a gentle reflection that invites the listener to carry it forward.
Tone: Respectful, enduring, a little nostalgic. Allow imperfect memory (“I think it was…”, “as I recall…”).`,

  kitchen: `Story Type: Kitchen-Table Anecdote
Voice: Conversational, natural, present-tense or easy past, as if telling it across a table with coffee or tea in hand.
Structure: Hook with the most vivid or funny detail, tell the events in loose chronological order, include small asides or self-corrections, land on a warm or wry closing beat.
Tone: Living-room real — humor welcome, tenderness welcome, no need to tidy every edge.`,

  bedtime: `Story Type: Bedtime Legacy Tale
Voice: Gentle, rhythmic, slightly storybook, second-person or soft third — suitable for reading aloud to a child or grandchild.
Structure: Soft opening image, clear but unhurried sequence of events, comforting resolution or quiet wonder at the end.
Tone: Safe, loving, wonder-filled. Short sentences and gentle repetition are welcome. Avoid anything frightening or overly complex.`,

  chronicle: `Story Type: Heritage Chronicle
Voice: Clear, respectful, archival yet warm — third-person preferred unless the source is strongly first-person.
Structure: Situate the memory in time and place early, present events in coherent order, close with significance for the family line.
Tone: Dignified and precise. Prioritize clarity and continuity so the story can serve as a lasting family record.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originalText,
      storyType = "fireside",
      contextNotes = "",
      metadata = "",
    } = body;

    if (!originalText?.trim()) {
      return NextResponse.json({ error: "Original text is required" }, { status: 400 });
    }

    const typePrompt = TYPE_PROMPTS[storyType] || TYPE_PROMPTS.fireside;

    const userContent = `Story Type: ${storyType}

Raw memory / notes:
${originalText}

Additional context (relationship, era, places, cultural or lineage notes, details that must stay exact):
${contextNotes || "None provided"}

Preferred length or other tweaks: ${metadata || "None"}`;

    const completion = await client.chat.completions.create({
      model: "grok-4.5",
      messages: [
        { role: "system", content: `${BASE_SYSTEM}\n\n${typePrompt}` },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const generated = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({
      generatedText: generated,
      storyType,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("Hearthify error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate story" },
      { status: 500 }
    );
  }
}
