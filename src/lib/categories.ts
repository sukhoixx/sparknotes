export const CATEGORY_LIST = [
  { id: "news",          label: "News",          emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", lightGradient: "linear-gradient(135deg,#a8d8ea,#aa96da)" },
  { id: "science",       label: "Science",       emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)",          lightGradient: "linear-gradient(135deg,#a8e6cf,#d4fc79)" },
  { id: "technology",    label: "Technology",    emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)",          lightGradient: "linear-gradient(135deg,#c3b1e1,#a2d2ff)" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)",          lightGradient: "linear-gradient(135deg,#ffc8dd,#ffafcc)" },
  { id: "sports",        label: "Sports",        emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)",          lightGradient: "linear-gradient(135deg,#ffd166,#ffb347)" },
  { id: "business",      label: "Business",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)",          lightGradient: "linear-gradient(135deg,#b5ead7,#a8dadc)" },
  { id: "gaming",        label: "Gaming",        emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)",          lightGradient: "linear-gradient(135deg,#e0b1cb,#c77dff)" },
  { id: "travel",        label: "Travel",        emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)",          lightGradient: "linear-gradient(135deg,#ffd6a5,#fdffb6)" },
  { id: "animals",       label: "Animals",       emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)",          lightGradient: "linear-gradient(135deg,#b7e4c7,#95d5b2)" },
  { id: "inventions",    label: "Inventions",    emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)",          lightGradient: "linear-gradient(135deg,#ffe566,#f8961e)" },
] as const;

export type CategoryId = (typeof CATEGORY_LIST)[number]["id"];
