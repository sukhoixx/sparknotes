"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { CATEGORY_LIST } from "@/lib/categories";
import type { UserProfile } from "@/hooks/useProfile";

interface ProfileModalProps {
  profile: UserProfile | null;
  onSave: (screenName: string, categories: string[]) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
}

interface DailyReward {
  date: string;
  articlesRead: number;
  pointsEarned: number;
  multiplier: number;
  badge: string | null;
}

const BADGE_META: Record<string, { emoji: string; label: string; color: string }> = {
  bronze:  { emoji: "🥉", label: "Bronze",  color: "#cd7f32" },
  silver:  { emoji: "🥈", label: "Silver",  color: "#9e9e9e" },
  gold:    { emoji: "🥇", label: "Gold",    color: "#ffc107" },
  diamond: { emoji: "💎", label: "Diamond", color: "#00b4d8" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RewardsTab({ isAuthenticated, onSignIn }: { isAuthenticated: boolean; onSignIn?: () => void }) {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetch(`/api/rewards?tz=${new Date().getTimezoneOffset()}`)
      .then((r) => r.json())
      .then((d) => {
        setRewards(d.rewards ?? []);
        setStreak(d.streak ?? 0);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <span className="text-[48px]">🏆</span>
        <p className="text-[16px] font-bold text-gray-800">Earn Reading Rewards</p>
        <p className="text-[13px] text-gray-500 max-w-[260px]">
          Sign in to track your daily reading and earn points, badges, and streak multipliers.
        </p>
        {onSignIn && (
          <button
            onClick={onSignIn}
            className="mt-2 bg-[#ff2442] text-white font-bold text-[14px] rounded-[16px] px-6 py-[10px] border-0 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-[22px] h-[22px] border-[3px] border-gray-200 border-t-[#ff2442] rounded-full animate-spin" />
      </div>
    );
  }

  // Today's reward (first row since ordered desc)
  const today = rewards[0];
  const multiplier = today?.multiplier ?? 1;
  const multiplierLabel = multiplier >= 2 ? "2× (14-day streak!)" : multiplier >= 1.5 ? "1.5× (7-day streak!)" : "1×";
  const todayBadge = today?.badge ? BADGE_META[today.badge] : null;

  // Total points over 30 days
  const totalPoints = rewards.reduce((s, r) => s + r.pointsEarned, 0);

  function localDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Build a 30-slot grid: fill in rewards by date, gaps = 0
  const slots: (DailyReward | null)[] = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = localDateKey(d);
    return rewards.find((r) => r.date.slice(0, 10) === key) ?? null;
  });

  const maxPts = Math.max(...slots.map((s) => s?.pointsEarned ?? 0), 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Streak + multiplier banner */}
      <div
        className="rounded-[16px] px-4 py-3 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #6c47ff, #ff2442)" }}
      >
        <span className="text-[36px]">🔥</span>
        <div className="flex-1">
          <p className="text-white font-extrabold text-[18px] leading-none">{streak}-day streak</p>
          <p className="text-white/80 text-[12px] mt-[2px]">
            Reward multiplier: <span className="text-white font-bold">{multiplierLabel}</span>
          </p>
        </div>
      </div>

      {/* Today's status */}
      <div className="bg-gray-50 rounded-[16px] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide">Today</p>
          <p className="text-[22px] font-extrabold text-gray-900 leading-none mt-[2px]">
            {today?.articlesRead ?? 0} <span className="text-[14px] font-normal text-gray-400">articles</span>
          </p>
          <p className="text-[13px] text-[#ff2442] font-bold mt-[2px]">
            {today ? today.pointsEarned.toFixed(1) : "0"} pts earned
          </p>
        </div>
        {todayBadge ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[40px]">{todayBadge.emoji}</span>
            <span className="text-[11px] font-bold" style={{ color: todayBadge.color }}>{todayBadge.label}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-30">
            <span className="text-[40px]">🥉</span>
            <span className="text-[11px] text-gray-400">Read 10 to earn</span>
          </div>
        )}
      </div>

      {/* Badge thresholds legend */}
      <div className="grid grid-cols-4 gap-2">
        {(["bronze", "silver", "gold", "diamond"] as const).map((b) => {
          const meta = BADGE_META[b];
          const thresholds: Record<string, number> = { bronze: 10, silver: 20, gold: 30, diamond: 40 };
          return (
            <div key={b} className="bg-gray-50 rounded-[12px] flex flex-col items-center py-2 gap-[2px]">
              <span className="text-[22px]">{meta.emoji}</span>
              <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-[10px] text-gray-400">{thresholds[b]}+ articles</span>
            </div>
          );
        })}
      </div>

      {/* 30-day bar chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-semibold text-gray-700">Last 30 days</p>
          <p className="text-[12px] text-gray-400">{totalPoints.toFixed(1)} total pts</p>
        </div>
        <div className="flex items-end gap-[3px] h-[56px]">
          {slots.map((slot, i) => {
            const pts = slot?.pointsEarned ?? 0;
            const heightPct = pts > 0 ? Math.max(10, (pts / maxPts) * 100) : 0;
            const badge = slot?.badge;
            const barColor = badge ? BADGE_META[badge].color : "#ff2442";
            const isToday = i === 29;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={slot ? `${formatDate(slot.date)}: ${pts.toFixed(1)} pts` : ""}>
                <div
                  className="w-full rounded-[3px] transition-all"
                  style={{
                    height: pts > 0 ? `${heightPct}%` : "3px",
                    background: pts > 0 ? barColor : "#e5e7eb",
                    opacity: isToday ? 1 : 0.7,
                    outline: isToday ? "2px solid #ff2442" : "none",
                    outlineOffset: "1px",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">30d ago</span>
          <span className="text-[10px] text-gray-400">Today</span>
        </div>
      </div>

      {/* Streak multiplier guide */}
      <div className="bg-gray-50 rounded-[14px] px-4 py-3">
        <p className="text-[12px] font-semibold text-gray-600 mb-2">Streak multipliers</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">7-day streak</span>
            <span className="font-bold text-[#6c47ff]">1.5× points</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-500">14-day streak</span>
            <span className="font-bold text-[#ff2442]">2× points</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileModal({ profile, onSave, onClose, isAuthenticated = false, onSignIn }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "rewards">("profile");
  const [name, setName] = useState(profile?.screenName ?? "");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(profile?.categories ?? [])
  );
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(
    !isAuthenticated ? (profile ? true : null) : (profile ? true : null)
  );
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstTime = !profile;

  const checkName = useCallback((value: string) => {
    if (!isAuthenticated) {
      setNameAvailable(value.trim().length >= 2 ? true : null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setNameAvailable(null); return; }
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/profile/check?name=${encodeURIComponent(value.trim())}`);
      const d = await res.json();
      setNameAvailable(d.available);
      setChecking(false);
    }, 400);
  }, [isAuthenticated]);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canSave =
    name.trim().length >= 2 &&
    nameAvailable === true &&
    selectedCats.size >= 3 &&
    !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    const result = await onSave(name.trim(), Array.from(selectedCats));
    setSaving(false);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[300] flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget && !isFirstTime) onClose(); }}
    >
      <div className="bg-white rounded-t-[24px] w-full max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto scrollbar-none animate-slide-up">
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mt-3" />

        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-extrabold text-gray-900">
              {isFirstTime ? "Set Up Your Profile" : "Your Profile"}
            </h2>
            {!isFirstTime && (
              <button onClick={onClose} className="text-gray-400 text-[20px] bg-transparent border-0 cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Tabs — only show when profile already exists */}
          {!isFirstTime && (
            <div className="flex gap-1 bg-gray-100 rounded-[14px] p-[3px] mb-4">
              {(["profile", "rewards"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-[7px] rounded-[11px] text-[13px] font-semibold border-0 cursor-pointer transition-all"
                  style={activeTab === tab
                    ? { background: "#fff", color: "#111", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }
                    : { background: "transparent", color: "#9ca3af" }
                  }
                >
                  {tab === "profile" ? "Profile" : "🏆 Rewards"}
                </button>
              ))}
            </div>
          )}

          {/* Tab content */}
          {activeTab === "rewards" && !isFirstTime ? (
            <RewardsTab isAuthenticated={isAuthenticated} onSignIn={onSignIn} />
          ) : (
            <>
              {/* Guest banner */}
              {!isAuthenticated && (
                <div className="bg-amber-50 border-l-[3px] border-amber-400 rounded-r-[10px] px-3 py-2 mb-4 text-[12px] text-amber-800">
                  You&apos;re browsing as a guest. Your preferences are saved locally.{" "}
                  {onSignIn && (
                    <button onClick={onSignIn} className="bg-transparent border-0 cursor-pointer text-[#ff2442] font-semibold p-0 underline">
                      Sign in to sync across devices.
                    </button>
                  )}
                </div>
              )}

              {/* Screen name */}
              <label className="block text-[13px] font-semibold text-gray-600 mb-1">Screen name</label>
              <div className="relative mb-1">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameAvailable(null); checkName(e.target.value); }}
                  placeholder="e.g. CosmicReader42"
                  maxLength={50}
                  className="w-full bg-gray-100 rounded-[14px] px-4 py-[10px] text-[15px] text-gray-900 outline-none border-0 pr-10"
                />
                {isAuthenticated && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px]">
                    {checking ? "⏳" : nameAvailable === true ? "✅" : nameAvailable === false ? "❌" : ""}
                  </span>
                )}
              </div>
              {isAuthenticated && nameAvailable === false && (
                <p className="text-[12px] text-[#ff2442] mb-3">That name is taken — try another.</p>
              )}
              {nameAvailable === true && name.trim().length >= 2 && (
                <p className="text-[12px] text-green-600 mb-3">Looks good!</p>
              )}
              {nameAvailable === null && name.trim().length > 0 && name.trim().length < 2 && (
                <p className="text-[12px] text-gray-400 mb-3">At least 2 characters required.</p>
              )}
              {nameAvailable === null && name.trim().length === 0 && <div className="mb-3" />}

              {/* Category picker */}
              <label className="block text-[13px] font-semibold text-gray-600 mb-2">
                Pick your interests
                <span className="text-gray-400 font-normal ml-1">(choose at least 3)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-5">
                {CATEGORY_LIST.map((cat) => {
                  const on = selectedCats.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCat(cat.id)}
                      className="flex items-center gap-[5px] px-3 py-[6px] rounded-[20px] text-[13px] font-semibold border-0 cursor-pointer transition-all"
                      style={on ? { background: cat.gradient, color: "#fff" } : { background: "#f3f4f6", color: "#6b7280" }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })}
              </div>

              {selectedCats.size > 0 && selectedCats.size < 3 && (
                <p className="text-[12px] text-[#ff2442] mb-3">
                  Select {3 - selectedCats.size} more {3 - selectedCats.size === 1 ? "category" : "categories"}.
                </p>
              )}

              {error && <p className="text-[12px] text-[#ff2442] mb-3">{error}</p>}

              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full bg-[#ff2442] text-white font-bold text-[15px] rounded-[16px] py-[13px] border-0 cursor-pointer disabled:opacity-40 transition-opacity"
              >
                {saving ? "Saving…" : isFirstTime ? "Create Profile" : "Save Changes"}
              </button>

              {!isFirstTime && isAuthenticated && (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full mt-3 bg-transparent border-0 cursor-pointer text-[13px] text-gray-400 py-2"
                >
                  Sign out
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
