"use client";

import { useEffect, useState } from "react";

export interface UserProfile {
  screenName: string;
  categories: string[];
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let id = localStorage.getItem("sparkDeviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("sparkDeviceId", id);
    }
    setDeviceId(id);

    fetch(`/api/profile?deviceId=${id}`)
      .then((r) => r.json())
      .then((d) => { setProfile(d.profile ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function saveProfile(
    screenName: string,
    categories: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    if (!deviceId) return { ok: false, error: "No device ID" };
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, screenName, categories }),
    });
    const d = await res.json();
    if (d.profile) {
      setProfile(d.profile);
      return { ok: true };
    }
    return { ok: false, error: d.error ?? "Unknown error" };
  }

  return { profile, loading, deviceId, saveProfile };
}
