"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // assume you have shadcn input
import { Flame } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/studio";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleMagicLink() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage("Check your email for the login link.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-md bg-stone-900/90 border border-amber-900/40 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Flame className="mx-auto h-10 w-10 text-orange-500 mb-3" />
          <h1 className="text-2xl font-serif text-amber-50">HearthThread</h1>
          <p className="text-stone-400 mt-1">Sign in to your family stories</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-stone-950 border-stone-700 text-amber-50"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-stone-950 border-stone-700 text-amber-50"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-700 hover:bg-orange-600"
          >
            {loading ? "Signing in..." : "Sign in with password"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-stone-900 text-stone-500">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleMagicLink}
          disabled={loading || !email}
          className="w-full bg-stone-800 hover:bg-stone-700 text-amber-50"
        >
          Email me a magic link
        </Button>

        {message && (
          <p className="mt-4 text-sm text-center text-amber-200/90">{message}</p>
        )}
      </div>
    </div>
  );
}
