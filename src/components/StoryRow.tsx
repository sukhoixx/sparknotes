const STORIES = [
  { emoji: "📰", label: "News",          bg: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  { emoji: "🔬", label: "Science",       bg: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { emoji: "💻", label: "Technology",    bg: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  { emoji: "🎬", label: "Entertainment", bg: "linear-gradient(135deg,#f953c6,#b91d73)" },
  { emoji: "🌍", label: "World",         bg: "linear-gradient(135deg,#fc4a1a,#f7b733)" },
  { emoji: "🚀", label: "Space",         bg: "linear-gradient(135deg,#0f0c29,#302b63)" },
];

export default function StoryRow() {
  return (
    <div className="flex gap-[10px] px-4 py-3 overflow-x-auto scrollbar-none bg-white mb-[6px]">
      {STORIES.map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-[5px] cursor-pointer shrink-0">
          <div className="w-[60px] h-[60px] rounded-full p-[2.5px] bg-gradient-to-br from-[#ff2442] to-[#ff9a00]">
            <div
              className="w-full h-full rounded-full border-2 border-white flex items-center justify-center text-[24px]"
              style={{ background: s.bg }}
            >
              {s.emoji}
            </div>
          </div>
          <span className="text-[11px] text-gray-800 text-center max-w-[60px] truncate">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
