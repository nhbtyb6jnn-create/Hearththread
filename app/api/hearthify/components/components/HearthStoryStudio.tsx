"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // adjust if not using shadcn
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Flame, BookOpen, Save } from "lucide-react";
import { cn } from "@/lib/utils"; // standard clsx + twMerge helper

type StoryType = "fireside" | "kitchen" | "bedtime" | "chronicle";

interface HearthSceneProps {
  season?: "summer" | "winter";
  beverage?: "coffee" | "tea" | "either";
  animals?: string[];          // e.g. ["dog", "cat", "bird"]
  hearthLevel?: number;        // 1–10 for mild evolution
}

function HearthBackground({ season = "summer", beverage = "either", animals = [], hearthLevel = 1 }: HearthSceneProps) {
  const isWinter = season === "winter";
  const showDog = animals.includes("dog") || hearthLevel >= 2;
  const showCat = animals.includes("cat") || hearthLevel >= 4;
  const showBirds = animals.includes("bird") || hearthLevel >= 6;
  const mug = beverage === "tea" ? "tea" : "coffee";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Sky & distant landscape */}
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-1000",
          isWinter
            ? "bg-gradient-to-b from-slate-800 via-slate-700 to-stone-800"
            : "bg-gradient-to-b from-sky-300 via-amber-100 to-orange-200"
        )}
      />
      {/* Soft ground */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1/3 transition-colors duration-1000",
          isWinter ? "bg-slate-200/80" : "bg-emerald-800/40"
        )}
      />
      {/* Massive stone hearth – broad and solid */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl">
        <div className="relative mx-auto h-48 md:h-64 rounded-t-[40%] bg-stone-700 shadow-2xl border-t-8 border-stone-500">
          {/* Fire glow */}
          <div className="absolute inset-x-8 bottom-4 h-20 md:h-28 rounded-full bg-orange-500/80 blur-xl animate-pulse" />
          <div className="absolute inset-x-12 bottom-6 h-12 md:h-16 rounded-full bg-yellow-300/90 blur-md" />
          {/* Stones detail */}
          <div className="absolute inset-0 rounded-t-[40%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-600/40 to-transparent" />
        </div>
        {/* Mug on the hearth */}
        <div className="absolute -top-6 right-[18%] md:right-[22%]">
          <div className={cn(
            "w-10 h-12 rounded-b-lg rounded-t-sm shadow-lg border border-stone-600",
            mug === "tea" ? "bg-amber-800" : "bg-stone-800"
          )}>
            <div className="absolute -right-3 top-3 w-4 h-6 border-2 border-stone-500 rounded-r-full" />
            <div className="absolute inset-x-1 top-1 h-2 rounded-sm bg-orange-100/30" />
          </div>
        </div>
      </div>

      {/* Animals – appear with progress */}
      {showDog && (
        <div className="absolute bottom-24 left-[12%] text-4xl md:text-5xl opacity-90">🐕</div>
      )}
      {showCat && (
        <div className="absolute bottom-28 right-[14%] text-3xl md:text-4xl opacity-90">🐈</div>
      )}
      {showBirds && (
        <div className="absolute top-20 left-[20%] text-2xl opacity-70">🐦</div>
      )}

      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-black/20 md:bg-black/10" />
    </div>
  );
}

export default function HearthStoryStudio({
  initialSeason = "summer",
  initialBeverage = "either",
  hearthLevel = 1,
  onSave,
}: {
  initialSeason?: "summer" | "winter";
  initialBeverage?: "coffee" | "tea" | "either";
  hearthLevel?: number;
  onSave?: (data: any) => Promise<void>;
}) {
  const [originalText, setOriginalText] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [storyType, setStoryType] = useState<StoryType>("fireside");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [season] = useState(initialSeason); // later driven by progress / story content

  async function handleGenerate() {
    if (!originalText.trim()) return;
    setLoading(true);
    setError("");
    setGeneratedText("");

    try {
      const res = await fetch("/api/hearthify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText,
          storyType,
          contextNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGeneratedText(data.generatedText);
    } catch (err: any) {
      setError(err.message || "Something went wrong by the hearth");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <HearthBackground
        season={season}
        beverage={initialBeverage}
        hearthLevel={hearthLevel}
        animals={[]} // later pass real list from profile
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-16">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-serif text-amber-50 drop-shadow-lg tracking-wide">
            HearthThread
          </h1>
          <p className="mt-2 text-amber-100/90 text-lg">
            Bring a family memory to the fire
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Input side */}
          <div className="bg-stone-900/70 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-amber-900/40 shadow-xl">
            <label className="block text-amber-100 text-sm mb-2">Raw memory</label>
            <Textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste or type the memory as it was told to you..."
              className="min-h-[180px] bg-stone-950/60 border-stone-600 text-amber-50 placeholder:text-stone-500"
            />

            <label className="block text-amber-100 text-sm mt-4 mb-2">
              Context & must-keep details
            </label>
            <Textarea
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Who, when, relationship, cultural notes, facts that must stay exact..."
              className="min-h-[80px] bg-stone-950/60 border-stone-600 text-amber-50 placeholder:text-stone-500"
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Select value={storyType} onValueChange={(v) => setStoryType(v as StoryType)}>
                <SelectTrigger className="bg-stone-950/60 border-stone-600 text-amber-50">
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
                disabled={loading || !originalText.trim()}
                className="bg-orange-700 hover:bg-orange-600 text-amber-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tending the fire...
                  </>
                ) : (
                  <>
                    <Flame className="mr-2 h-4 w-4" />
                    Hearthify
                  </>
                )}
              </Button>
            </div>

            {error && <p className="mt-3 text-red-300 text-sm">{error}</p>}
          </div>

          {/* Result side */}
          <div className="bg-stone-900/70 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-amber-900/40 shadow-xl flex flex-col">
            <div className="flex items-center gap-2 text-amber-100 mb-3">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">The story by the hearth</span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[420px] pr-2">
              {generatedText ? (
                <div className="prose prose-invert prose-amber max-w-none text-amber-50/95 leading-relaxed whitespace-pre-wrap">
                  {generatedText}
                </div>
              ) : (
                <p className="text-stone-400 italic">
                  The flames are waiting for a memory...
                </p>
              )}
            </div>

            {generatedText && (
              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-stone-700 hover:bg-stone-600 text-amber-50"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={() =>
                    onSave?.({
                      originalText,
                      contextNotes,
                      storyType,
                      generatedText,
                    })
                  }
                  className="bg-amber-800 hover:bg-amber-700 text-amber-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Keep this story
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
