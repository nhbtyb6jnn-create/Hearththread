"use client";

import HearthStoryStudio from "@/components/HearthStoryStudio";
import { saveStory } from "@/lib/stories";
import { useRouter } from "next/navigation";

export default function StudioPage() {
  const router = useRouter();

  async function handleSave(data: any) {
    try {
      await saveStory(data);
      // Optional: redirect to library after save
      router.push("/library");
    } catch (err: any) {
      alert(err.message || "Could not keep the story.");
    }
  }

  return (
    <HearthStoryStudio
      initialSeason="summer"
      initialBeverage="coffee"
      hearthLevel={3}
      onSave={handleSave}
    />
  );
}
