import HearthStoryStudio from "@/components/HearthStoryStudio";

export default function Home() {
  return (
    <HearthStoryStudio
      initialSeason="summer"
      initialBeverage="coffee"
      hearthLevel={3}
      // onSave={async (data) => { /* call Supabase insert */ }}
    />
  );
}
