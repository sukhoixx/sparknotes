const STORIES = [
  { emoji: "🦋", label: "Bugs", bg: "linear-gradient(135deg,#a8edea,#fed6e3)" },
  { emoji: "🚀", label: "Space", bg: "linear-gradient(135deg,#1a1a2e,#16213e)" },
  { emoji: "🐬", label: "Ocean", bg: "linear-gradient(135deg,#0093e9,#80d0c7)" },
  { emoji: "🌋", label: "Earth", bg: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { emoji: "⚽", label: "Sports", bg: "linear-gradient(135deg,#43e97b,#38f9d7)" },
  { emoji: "🤖", label: "AI", bg: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  { emoji: "🎨", label: "Arts", bg: "linear-gradient(135deg,#a18cd1,#fbc2eb)" },
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
