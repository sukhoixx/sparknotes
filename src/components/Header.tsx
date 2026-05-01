"use client";

import { useCallback, useRef, useState } from "react";

interface HeaderProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  onSearch: (q: string) => void;
}

export default function Header({ category, onCategoryChange, onSearch }: HeaderProps) {
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
    <header className="bg-white sticky top-0 z-[100] shadow-[0_1px_8px_rgba(0,0,0,.06)]">
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
                className="flex-1 flex items-center bg-gray-100 rounded-[20px] px-[14px] py-2 gap-[6px] border-0 text-[14px] text-gray-400 cursor-text"
              >
                <span>🔍</span>
                Search news for kids…
              </button>
              <button className="w-9 h-9 rounded-full bg-gray-100 border-0 flex items-center justify-center text-[18px] cursor-pointer relative">
                🔔
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff2442] rounded-full border-[1.5px] border-white" />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center bg-gray-100 rounded-[20px] px-[14px] py-2 gap-[6px]">
              <span>🔍</span>
              <input
                autoFocus
                className="flex-1 bg-transparent border-0 outline-none text-[14px] text-gray-800"
                placeholder="Search news for kids…"
                value={query}
                onChange={handleInput}
              />
              <button onClick={clearSearch} className="text-gray-400 border-0 bg-transparent cursor-pointer text-[18px]">
                ✕
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
