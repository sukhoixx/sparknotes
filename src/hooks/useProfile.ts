"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface UserProfile {
  screenName: string;
  categories: string[];
}

export function useProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { setLoading(false); return; }

    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { setProfile(d.profile ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  async function saveProfile(
    screenName: string,
    categories: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screenName, categories }),
    });
    const data = await res.json();
    if (res.ok) setProfile(data.profile);
    return { ok: res.ok, error: data.error };
  }

  return {
    profile,
    loading,
    isAuthenticated: status === "authenticated",
    saveProfile,
  };
}
