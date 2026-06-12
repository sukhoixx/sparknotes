"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export interface UserProfile {
  screenName: string;
  categories: string[];
}

const GUEST_KEY = "newsblock_guest_profile";

function loadGuestProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.screenName && Array.isArray(p.categories)) return p;
    return null;
  } catch { return null; }
}

function saveGuestProfile(p: UserProfile) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(p)); } catch {}
}

export function useProfile() {
  const { status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setProfile(loadGuestProfile());
      setLoading(false);
      return;
    }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => { setProfile(d.profile ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [status]);

  async function saveProfile(
    screenName: string,
    categories: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    if (status === "unauthenticated") {
      const p = { screenName, categories };
      saveGuestProfile(p);
      setProfile(p);
      return { ok: true };
    }
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
