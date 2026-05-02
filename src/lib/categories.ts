export const CATEGORY_LIST = [
  { id: "news",          label: "News",          emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", lightGradient: "linear-gradient(135deg,#d4eef7,#ddd8f5)" },
  { id: "science",       label: "Science",       emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)",          lightGradient: "linear-gradient(135deg,#d4f5e9,#eafcd2)" },
  { id: "technology",    label: "Technology",    emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)",          lightGradient: "linear-gradient(135deg,#e5dcf7,#d6eaff)" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)",          lightGradient: "linear-gradient(135deg,#ffe4f0,#ffd6eb)" },
  { id: "sports",        label: "Sports",        emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)",          lightGradient: "linear-gradient(135deg,#fff3b3,#ffe0a0)" },
  { id: "business",      label: "Business",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)",          lightGradient: "linear-gradient(135deg,#d8f5eb,#d4eef0)" },
  { id: "gaming",        label: "Gaming",        emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)",          lightGradient: "linear-gradient(135deg,#f0dcea,#ead6ff)" },
  { id: "travel",        label: "Travel",        emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)",          lightGradient: "linear-gradient(135deg,#feeee0,#fffde0)" },
  { id: "animals",       label: "Animals",       emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)",          lightGradient: "linear-gradient(135deg,#dcf5e5,#d0f0e0)" },
  { id: "inventions",    label: "Inventions",    emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)",          lightGradient: "linear-gradient(135deg,#fff8c0,#fde8cc)" },
] as const;

export type CategoryId = (typeof CATEGORY_LIST)[number]["id"];
