import { createClient } from "@/lib/supabase/client";
import { StoryType } from "@/lib/prompts";

export async function saveStory(payload: {
  originalText: string;
  contextNotes: string;
  storyType: StoryType;
  generatedText: string;
  title?: string;
  personId?: string | null;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to keep a story.");
  }

  // Insert the main story record
  const { data: story, error: storyError } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      original_text: payload.originalText,
      context_notes: payload.contextNotes || null,
      story_type: payload.storyType,
      generated_text: payload.generatedText,
      title: payload.title || null,
      person_id: payload.personId || null,
    })
    .select("id")
    .single();

  if (storyError || !story) {
    console.error(storyError);
    throw new Error("Could not save the story.");
  }

  // Always keep a version so regenerations never destroy history
  const { error: versionError } = await supabase.from("story_versions").insert({
    story_id: story.id,
    generated_text: payload.generatedText,
    story_type: payload.storyType,
  });

  if (versionError) {
    console.error("Version save failed:", versionError);
    // Non-fatal – main story is already saved
  }

  // Mild hearth progression
  await supabase.rpc("increment_hearth_level", { row_id: user.id }).catch(() => {
    // optional – we can add the function below
  });

  // Clear draft
  localStorage.removeItem("hearththread_draft_v1");

  return story.id;
}

// Optional: simple RPC you can add in Supabase SQL
/*
create or replace function public.increment_hearth_level(row_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set hearth_level = least(hearth_level + 1, 20)
  where id = row_id;
end;
$$;
*/
