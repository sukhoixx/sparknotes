"use client";

import { useCallback, useRef, useState } from "react";
import type { AbVariant } from "@/hooks/useAbVariant";

const TABS = [
  { id: "all",           label: "✨ For You" },
  { id: "news",          label: "📰 News" },
  { id: "us",            label: "🇺🇸 US" },
  { id: "world",         label: "🌍 World" },
  { id: "politics",      label: "🏛️ Politics" },
  { id: "military",      label: "🪖 Military" },
  { id: "science",       label: "🔬 Science" },
  { id: "technology",    label: "💻 Technology" },
  { id: "entertainment", label: "🎬 Entertainment" },
  { id: "celebrity",     label: "⭐ Celebrity" },
  { id: "sports",        label: "🏅 Sports" },
  { id: "business",      label: "💼 Business" },
  { id: "gaming",        label: "🎮 Gaming" },
  { id: "travel",        label: "✈️ Travel" },
  { id: "animals",       label: "🐾 Animals" },
  { id: "inventions",    label: "💡 Inventions" },
  { id: "finance",       label: "💰 Finance" },
  { id: "health",        label: "💊 Health" },
  { id: "beauty",        label: "💄 Beauty" },
];

interface HeaderProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  onSearch: (q: string) => void;
  profile?: { screenName: string } | null;
  onProfileClick?: () => void;
  variant?: AbVariant;
}

export default function Header({ category, onCategoryChange, onSearch, profile, onProfileClick, variant }: HeaderProps) {
  const dark = variant === "A";
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(val), 300);
    },
    [onSearch]
  );

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    setSearchOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-[100]"
      style={{
        background: dark ? "#1c1c1e" : "#ffffff",
        borderBottom: dark ? "1px solid #2c2c2e" : undefined,
        boxShadow: dark ? "none" : "0 1px 8px rgba(0,0,0,.06)",
      }}
    >
      <div className="px-4 pt-3">
        {/* Top row */}
        <div className="flex items-center gap-[10px] mb-3">
          {!searchOpen ? (
            <>
              <a className="flex items-center gap-[6px] text-[20px] font-extrabold text-[#ff2442] no-underline whitespace-nowrap" href="#">
                <div className="w-8 h-8 bg-[#ff2442] rounded-lg flex items-center justify-center text-[18px]">📰</div>
                SparkNotes
              </a>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex-1 flex items-center rounded-[20px] px-[14px] py-2 gap-[6px] border-0 text-[14px] cursor-text"
                style={{
                  background: dark ? "#2c2c2e" : "#f3f4f6",
                  color: dark ? "#8e8e93" : "#9ca3af",
                }}
              >
                <span>🔍</span>
                Search the latest news…
              </button>
              <button
                onClick={onProfileClick}
                className="w-9 h-9 rounded-full border-0 flex items-center justify-center cursor-pointer shrink-0 overflow-hidden"
                style={profile ? { background: "#ff2442" } : { background: dark ? "#2c2c2e" : "#f3f4f6" }}
              >
                {profile ? (
                  <span className="text-white text-[15px] font-bold leading-none">
                    {profile.screenName[0].toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[18px]">👤</span>
                )}
              </button>
            </>
          ) : (
            <div
              className="flex-1 flex items-center rounded-[20px] px-[14px] py-2 gap-[6px]"
              style={{ background: dark ? "#2c2c2e" : "#f3f4f6" }}
            >
              <span>🔍</span>
              <input
                autoFocus
                className="flex-1 bg-transparent border-0 outline-none text-[14px]"
                style={{ color: dark ? "#ffffff" : "#1f2937" }}
                placeholder="Search the latest news…"
                value={query}
                onChange={handleInput}
              />
              <button
                onClick={clearSearch}
                className="border-0 bg-transparent cursor-pointer text-[18px]"
                style={{ color: dark ? "#8e8e93" : "#9ca3af" }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Category tabs */}
        {!searchOpen && (
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onCategoryChange(tab.id)}
                className="px-4 py-[6px] rounded-[20px] border-0 text-[14px] font-medium whitespace-nowrap cursor-pointer transition-all"
                style={
                  category === tab.id
                    ? { background: "#ff2442", color: "#ffffff", fontWeight: 700 }
                    : { background: "transparent", color: dark ? "#8e8e93" : "#9ca3af" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
