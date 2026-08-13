"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Archive, ArrowLeft, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Story = {
  id: string;
  title: string | null;
  story_type: string;
  generated_text: string | null;
  original_text: string;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
};

export default function StoryLibrary() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites" | "archived">("all");
  const [selected, setSelected] = useState<Story | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadStories();
  }, [filter]);

  async function loadStories() {
    setLoading(true);
    let query = supabase
      .from("stories")
      .select("id, title, story_type, generated_text, original_text, is_favorite, is_archived, created_at")
      .order("created_at", { ascending: false });

    if (filter === "favorites") query = query.eq("is_favorite", true);
    if (filter === "archived") query = query.eq("is_archived", true);
    else query = query.eq("is_archived", false);

    const { data, error } = await query;

    if (error) {
      console.error(error);
    } else {
      setStories(data || []);
    }
    setLoading(false);
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase
      .from("stories")
      .update({ is_favorite: !current })
      .eq("id", id);
    loadStories();
  }

  async function toggleArchive(id: string, current: boolean) {
    await supabase
      .from("stories")
      .update({ is_archived: !current })
      .eq("id", id);
    setSelected(null);
    loadStories();
  }

  return (
    <div className="relative min-h-screen bg-stone-950 text-amber-50">
      {/* Quiet background hint of the hearth */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black opacity-90 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-wide">
              Your Hearth Library
            </h1>
            <p className="text-stone-400 mt-1">
              Family stories kept by the fire
            </p>
          </div>
          <Button asChild className="bg-orange-700 hover:bg-orange-600">
            <Link href="/studio">
              <Flame className="mr-2 h-4 w-4" />
              New story
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "favorites", "archived"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                filter === f
                  ? "bg-amber-800 text-amber-50"
                  : "bg-stone-800 text-stone-300"
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-stone-400">Gathering stories...</p>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No stories here yet.</p>
            <Button asChild className="mt-4 bg-orange-700 hover:bg-orange-600">
              <Link href="/studio">Bring the first memory to the fire</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 hover:border-amber-900/60 transition cursor-pointer"
                onClick={() => setSelected(story)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="font-medium text-lg text-amber-50">
                      {story.title ||
                        story.generated_text?.slice(0, 60) + "..." ||
                        "Untitled memory"}
                    </h2>
                    <p className="text-sm text-stone-400 mt-1 capitalize">
                      {story.story_type.replace("-", " ")} ·{" "}
                      {new Date(story.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleFavorite(story.id, story.is_favorite)}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          story.is_favorite
                            ? "fill-red-500 text-red-500"
                            : "text-stone-400"
                        )}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleArchive(story.id, story.is_archived)}
                    >
                      <Archive className="h-4 w-4 text-stone-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple story reader modal / panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-amber-900/40 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 text-stone-400"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="mt-8">
              <h2 className="text-2xl font-serif text-amber-50 mb-2">
                {selected.title || "Family Story"}
              </h2>
              <p className="text-sm text-stone-400 capitalize mb-6">
                {selected.story_type} ·{" "}
                {new Date(selected.created_at).toLocaleString()}
              </p>

              <div className="prose prose-invert prose-amber max-w-none whitespace-pre-wrap leading-relaxed text-amber-50/95">
                {selected.generated_text || selected.original_text}
              </div>

              <div className="mt-8 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    toggleFavorite(selected.id, selected.is_favorite)
                  }
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {selected.is_favorite ? "Unfavorite" : "Favorite"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toggleArchive(selected.id, selected.is_archived)
                  }
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {selected.is_archived ? "Unarchive" : "Archive"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
