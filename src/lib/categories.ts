export const CATEGORY_LIST = [
  { id: "news",          label: "News",          emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)", darkGradient: "linear-gradient(135deg,#0a0a1a,#0a1428,#061830)", lightGradient: "linear-gradient(135deg,#d4eef7,#ddd8f5)" },
  { id: "science",       label: "Science",       emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)",          darkGradient: "linear-gradient(135deg,#0a7068,#22b85a)",       lightGradient: "linear-gradient(135deg,#d4f5e9,#eafcd2)" },
  { id: "technology",    label: "Technology",    emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)",          darkGradient: "linear-gradient(135deg,#4a28dd,#0088b0)",       lightGradient: "linear-gradient(135deg,#e5dcf7,#d6eaff)" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)",          darkGradient: "linear-gradient(135deg,#c020a0,#8a0f58)",       lightGradient: "linear-gradient(135deg,#ffe4f0,#ffd6eb)" },
  { id: "sports",        label: "Sports",        emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)",          darkGradient: "linear-gradient(135deg,#c87000,#c8a800)",       lightGradient: "linear-gradient(135deg,#fff3b3,#ffe0a0)" },
  { id: "business",      label: "Business",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)",          darkGradient: "linear-gradient(135deg,#0a3040,#4a8060)",       lightGradient: "linear-gradient(135deg,#d8f5eb,#d4eef0)" },
  { id: "gaming",        label: "Gaming",        emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)",          darkGradient: "linear-gradient(135deg,#2e0830,#b80008)",       lightGradient: "linear-gradient(135deg,#f0dcea,#ead6ff)" },
  { id: "travel",        label: "Travel",        emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)",          darkGradient: "linear-gradient(135deg,#c058d8,#c82848)",       lightGradient: "linear-gradient(135deg,#feeee0,#fffde0)" },
  { id: "animals",       label: "Animals",       emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)",          darkGradient: "linear-gradient(135deg,#509830,#286018)",       lightGradient: "linear-gradient(135deg,#dcf5e5,#d0f0e0)" },
  { id: "inventions",    label: "Inventions",    emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)",          darkGradient: "linear-gradient(135deg,#c8a030,#d86040)",       lightGradient: "linear-gradient(135deg,#fff8c0,#fde8cc)" },
] as const;

export type CategoryId = (typeof CATEGORY_LIST)[number]["id"];
