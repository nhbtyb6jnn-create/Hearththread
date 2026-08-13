import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { BASE_SYSTEM, TYPE_PROMPTS, ALLOWED_STORY_TYPES } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

const requestSchema = z.object({
  originalText: z.string().min(10).max(12000),
  storyType: z.enum(ALLOWED_STORY_TYPES),
  contextNotes: z.string().max(3000).optional().default(""),
  metadata: z.string().max(500).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    const { originalText, storyType, contextNotes, metadata } = parsed.data;

    const typePrompt = TYPE_PROMPTS[storyType];
    const userContent = `Story Type: ${storyType}

Raw memory / notes:
${originalText}

Additional context:
${contextNotes || "None"}

Tweaks: ${metadata || "None"}`;

    // 3. Stream from Grok
    const stream = await openai.chat.completions.create({
      model: "grok-4.5",
      messages: [
        { role: "system", content: `${BASE_SYSTEM}\n\n${typePrompt}` },
        { role: "user", content: userContent },
      ],
      temperature: storyType === "kitchen" || storyType === "bedtime" ? 0.75 : 0.6,
      max_tokens: 1400,
      stream: true,
    });

    // 4. Pipe the stream securely (only story text)
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Stream error for user", user.id, err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error("Hearthify error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Unable to generate story" }), {
      status: 500,
    });
  }
}

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { BASE_SYSTEM, TYPE_PROMPTS, ALLOWED_STORY_TYPES } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

const requestSchema = z.object({
  originalText: z.string().min(10).max(12000),
  storyType: z.enum(ALLOWED_STORY_TYPES),
  contextNotes: z.string().max(3000).optional().default(""),
  metadata: z.string().max(500).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }
    const { originalText, storyType, contextNotes, metadata } = parsed.data;

    const typePrompt = TYPE_PROMPTS[storyType];
    const userContent = `Story Type: ${storyType}

Raw memory / notes:
${originalText}

Additional context:
${contextNotes || "None"}

Tweaks: ${metadata || "None"}`;

    // 3. Stream from Grok
    const stream = await openai.chat.completions.create({
      model: "grok-4.5",
      messages: [
        { role: "system", content: `${BASE_SYSTEM}\n\n${typePrompt}` },
        { role: "user", content: userContent },
      ],
      temperature: storyType === "kitchen" || storyType === "bedtime" ? 0.75 : 0.6,
      max_tokens: 1400,
      stream: true,
    });

    // 4. Pipe the stream securely (only story text)
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Stream error for user", user.id, err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: any) {
    console.error("Hearthify error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Unable to generate story" }), {
      status: 500,
    });
  }
}
