"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { CATEGORY_LIST } from "@/lib/categories";
import type { UserProfile } from "@/hooks/useProfile";

interface ProfileModalProps {
  profile: UserProfile | null;
  onSave: (screenName: string, categories: string[]) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export default function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
  const [name, setName] = useState(profile?.screenName ?? "");
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(profile?.categories ?? [])
  );
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(profile ? true : null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstTime = !profile;

  const checkName = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setNameAvailable(null); return; }
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/profile/check?name=${encodeURIComponent(value.trim())}`);
      const d = await res.json();
      setNameAvailable(d.available);
      setChecking(false);
    }, 400);
  }, []);

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

  // Prevent body scroll
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-extrabold text-gray-900">
              {isFirstTime ? "Set Up Your Profile" : "Your Profile"}
            </h2>
            {!isFirstTime && (
              <button onClick={onClose} className="text-gray-400 text-[20px] bg-transparent border-0 cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Screen name */}
          <label className="block text-[13px] font-semibold text-gray-600 mb-1">Screen name</label>
          <div className="relative mb-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); checkName(e.target.value); setNameAvailable(null); }}
              placeholder="e.g. CosmicReader42"
              maxLength={50}
              className="w-full bg-gray-100 rounded-[14px] px-4 py-[10px] text-[15px] text-gray-900 outline-none border-0 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[16px]">
              {checking ? "⏳" : nameAvailable === true ? "✅" : nameAvailable === false ? "❌" : ""}
            </span>
          </div>
          {nameAvailable === false && (
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
                  style={
                    on
                      ? { background: cat.gradient, color: "#fff" }
                      : { background: "#f3f4f6", color: "#6b7280" }
                  }
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

          {!isFirstTime && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full mt-3 bg-transparent border-0 cursor-pointer text-[13px] text-gray-400 hover:text-[#ff2442] transition-colors py-2"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
