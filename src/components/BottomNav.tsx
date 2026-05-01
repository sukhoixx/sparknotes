"use client";

import { useState } from "react";

const NAV_ITEMS = [
  { icon: "🏠", label: "Home" },
  { icon: "🔍", label: "Discover" },
  { icon: null, label: "Post" },
  { icon: "💬", label: "Messages" },
  { icon: "👤", label: "Profile" },
];

export default function BottomNav() {
  const [active, setActive] = useState(0);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white flex border-t border-gray-100 z-[100] pb-safe">
      {NAV_ITEMS.map((item, i) => (
        <button
          key={item.label}
          onClick={() => setActive(i)}
          className="flex-1 flex flex-col items-center pt-2 pb-[6px] gap-[2px] border-0 bg-transparent cursor-pointer"
        >
          {item.icon === null ? (
            <span className="w-11 h-[30px] bg-gradient-to-br from-[#ff2442] to-[#ff6b7a] rounded-[10px] flex items-center justify-center text-[22px] text-white mt-[2px]">
              ＋
            </span>
          ) : (
            <span className="text-[22px]">{item.icon}</span>
          )}
          <span className={`text-[10px] font-medium ${active === i ? "text-[#ff2442]" : "text-gray-400"}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
