"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Flame, BookOpen, Save, Columns2, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_STORY_TYPES, type StoryType } from "@/lib/prompts";

interface HearthSceneProps {
  season?: "summer" | "winter";
  beverage?: "coffee" | "tea" | "either";
  hearthLevel?: number;
}

function HearthBackground({
  season = "summer",
  beverage = "either",
  hearthLevel = 1,
}: HearthSceneProps) {
  const isWinter = season === "winter";
  const showDog = hearthLevel >= 2;
  const showCat = hearthLevel >= 4;
  const showBirds = hearthLevel >= 6;
  const mug = beverage === "tea" ? "tea" : "coffee";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Sky */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-1000",
          isWinter
            ? "bg-gradient-to-b from-slate-900 via-slate-800 to-stone-900"
            : "bg-gradient-to-b from-sky-400/90 via-amber-100/80 to-orange-200/90"
        )}
      />
      {/* Ground */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[38%] transition-colors duration-1000",
          isWinter ? "bg-slate-300/70" : "bg-emerald-900/50"
        )}
      />
      {/* Massive broad stone hearth */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl">
        <div className="relative mx-auto h-52 md:h-72 rounded-t-[45%] bg-gradient-to-b from-stone-600 to-stone-800 shadow-2xl border-t-[12px] border-stone-500">
          {/* Fire core */}
          <div className="absolute inset-x-10 bottom-6 h-24 md:h-32 rounded-full bg-orange-600/90 blur-2xl animate-pulse" />
          <div className="absolute inset-x-16 bottom-10 h-14 md:h-20 rounded-full bg-yellow-400/90 blur-md" />
          <div className="absolute inset-x-20 bottom-12 h-8 rounded-full bg-amber-200/80 blur-sm" />
        </div>
        {/* Mug */}
        <div className="absolute -top-4 right-[15%] md:right-[20%]">
          <div
            className={cn(
              "w-11 h-14 rounded-b-md rounded-t-sm shadow-xl border-2 border-stone-600 relative",
              mug === "tea" ? "bg-amber-900" : "bg-stone-900"
            )}
          >
            <div className="absolute -right-3.5 top-4 w-5 h-7 border-2 border-stone-500 rounded-r-full bg-transparent" />
            <div className="absolute inset-x-1.5 top-1.5 h-2.5 rounded-sm bg-orange-100/20" />
          </div>
        </div>
      </div>

      {/* Quiet animal silhouettes that appear with progress */}
      {showDog && (
        <div className="absolute bottom-28 left-[9%] w-16 h-12 bg-stone-900/70 rounded-full blur-[1px]" />
      )}
      {showCat && (
        <div className="absolute bottom-32 right-[11%] w-12 h-10 bg-stone-900/60 rounded-full blur-[1px]" />
      )}
      {showBirds && (
        <>
          <div className="absolute top-24 left-[18%] w-3 h-3 bg-stone-800/50 rounded-full" />
          <div className="absolute top-28 left-[22%] w-2.5 h-2.5 bg-stone-800/40 rounded-full" />
        </>
      )}

      {/* Readability veil */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-black/10" />
    </div>
  );
}

const DRAFT_KEY = "hearththread_draft_v1";
const MAX_ORIGINAL = 12000;
const MAX_CONTEXT = 3000;

export default function HearthStoryStudio({
  initialSeason = "summer",
  initialBeverage = "either",
  hearthLevel = 1,
  onSave,
}: {
  initialSeason?: "summer" | "winter";
  initialBeverage?: "coffee" | "tea" | "either";
  hearthLevel?: number;
  onSave?: (data: {
    originalText: string;
    contextNotes: string;
    storyType: StoryType;
    generatedText: string;
  }) => Promise<void>;
}) {
  const [originalText, setOriginalText] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [storyType, setStoryType] = useState<StoryType>("fireside");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"stacked" | "side">("stacked");
  const [cooldown, setCooldown] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const supabase = createClient();

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.originalText) setOriginalText(draft.originalText);
        if (draft.contextNotes) setContextNotes(draft.contextNotes);
        if (draft.storyType && ALLOWED_STORY_TYPES.includes(draft.storyType)) {
          setStoryType(draft.storyType);
        }
      }
    } catch {
      // ignore corrupted draft
    }
  }, []);

  // Persist draft (debounced lightly by React)
  useEffect(() => {
    const draft = { originalText, contextNotes, storyType };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [originalText, contextNotes, storyType]);

  const handleGenerate = useCallback(async () => {
    if (!originalText.trim() || loading || cooldown) return;

    setLoading(true);
    setError("");
    setGeneratedText("");
    setCooldown(true);

    abortRef.current = new AbortController();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Please sign in to gather stories at the hearth.");
      }

      const res = await fetch("/api/hearthify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          originalText: originalText.slice(0, MAX_ORIGINAL),
          storyType,
          contextNotes: contextNotes.slice(0, MAX_CONTEXT),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "The fire could not be kindled.");
      }

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setGeneratedText(accumulated);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something quiet went wrong by the hearth.");
      }
    } finally {
      setLoading(false);
      // short cooldown to prevent accidental spam
      setTimeout(() => setCooldown(false), 2500);
    }
  }, [originalText, contextNotes, storyType, loading, cooldown, supabase]);

  const handleSave = async () => {
    if (!generatedText || !onSave) return;
    await onSave({
      originalText,
      contextNotes,
      storyType,
      generatedText,
    });
    // Clear draft after successful save
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <HearthBackground
        season={initialSeason}
        beverage={initialBeverage}
        hearthLevel={hearthLevel}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-14">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-serif text-amber-50 drop-shadow-lg tracking-wide">
            HearthThread
          </h1>
          <p className="mt-2 text-amber-100/90 text-base md:text-lg">
            Bring a family memory to the fire
          </p>
        </header>

        <div
          className={cn(
            "grid gap-6",
            viewMode === "side" && generatedText
              ? "md:grid-cols-2"
              : "grid-cols-1 max-w-3xl mx-auto"
          )}
        >
          {/* Input panel */}
          <div className="bg-stone-950/75 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-amber-900/50 shadow-2xl">
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-amber-100 text-sm font-medium">
                Raw memory
              </label>
              <span className="text-xs text-stone-400">
                {originalText.length} / {MAX_ORIGINAL}
              </span>
            </div>
            <Textarea
              value={originalText}
              onChange={(e) =>
                setOriginalText(e.target.value.slice(0, MAX_ORIGINAL))
              }
              placeholder="Paste or type the memory exactly as it was shared with you..."
              className="min-h-[160px] md:min-h-[200px] bg-stone-900/70 border-stone-700 text-amber-50 placeholder:text-stone-500 focus-visible:ring-amber-700"
              disabled={loading}
            />

            <div className="flex justify-between items-baseline mt-4 mb-1">
              <label className="text-amber-100 text-sm font-medium">
                Context & must-keep details
              </label>
              <span className="text-xs text-stone-400">
                {contextNotes.length} / {MAX_CONTEXT}
              </span>
            </div>
            <Textarea
              value={contextNotes}
              onChange={(e) =>
                setContextNotes(e.target.value.slice(0, MAX_CONTEXT))
              }
              placeholder="Who, approximate year, relationship, cultural notes, facts that must remain exact..."
              className="min-h-[70px] bg-stone-900/70 border-stone-700 text-amber-50 placeholder:text-stone-500 focus-visible:ring-amber-700"
              disabled={loading}
            />

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Select
                value={storyType}
                onValueChange={(v) => setStoryType(v as StoryType)}
                disabled={loading}
              >
                <SelectTrigger className="bg-stone-900/70 border-stone-700 text-amber-50">
                  <SelectValue placeholder="Story type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fireside">Fireside Oral History</SelectItem>
                  <SelectItem value="kitchen">Kitchen-Table Anecdote</SelectItem>
                  <SelectItem value="bedtime">Bedtime Legacy Tale</SelectItem>
                  <SelectItem value="chronicle">Heritage Chronicle</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleGenerate}
                disabled={loading || cooldown || originalText.trim().length < 10}
                className="bg-orange-700 hover:bg-orange-600 text-amber-50 min-w-[140px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tending...
                  </>
                ) : (
                  <>
                    <Flame className="mr-2 h-4 w-4" />
                    Hearthify
                  </>
                )}
              </Button>
            </div>

            {error && (
              <p className="mt-3 text-red-300 text-sm" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Result panel */}
          {(generatedText || loading) && (
            <div className="bg-stone-950/75 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-amber-900/50 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-100">
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">Story by the hearth</span>
                </div>
                {generatedText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setViewMode((m) => (m === "side" ? "stacked" : "side"))
                    }
                    className="text-amber-200/80 hover:text-amber-100"
                  >
                    {viewMode === "side" ? (
                      <Rows3 className="h-4 w-4" />
                    ) : (
                      <Columns2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[480px] pr-1">
                {generatedText ? (
                  <div className="prose prose-invert prose-amber max-w-none text-amber-50/95 leading-relaxed whitespace-pre-wrap">
                    {generatedText}
                  </div>
                ) : (
                  <p className="text-stone-400 italic flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    The story is being spoken by the fire...
                  </p>
                )}
              </div>

              {generatedText && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleGenerate}
                    disabled={loading || cooldown}
                    className="bg-stone-800 hover:bg-stone-700 text-amber-50"
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!onSave || loading}
                    className="bg-amber-800 hover:bg-amber-700 text-amber-50"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Keep this story
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
