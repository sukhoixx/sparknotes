export const CATEGORY_LIST = [
  { id: "news",          label: "News",          emoji: "📰", gradient: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  { id: "science",       label: "Science",       emoji: "🔬", gradient: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { id: "technology",    label: "Technology",    emoji: "💻", gradient: "linear-gradient(135deg,#6c47ff,#00b4d8)" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", gradient: "linear-gradient(135deg,#f953c6,#b91d73)" },
  { id: "sports",        label: "Sports",        emoji: "🏅", gradient: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { id: "business",      label: "Business",      emoji: "💼", gradient: "linear-gradient(135deg,#134e5e,#71b280)" },
  { id: "gaming",        label: "Gaming",        emoji: "🎮", gradient: "linear-gradient(135deg,#4b1248,#f10711)" },
  { id: "travel",        label: "Travel",        emoji: "✈️", gradient: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { id: "animals",       label: "Animals",       emoji: "🐾", gradient: "linear-gradient(135deg,#78c850,#3c8a2e)" },
  { id: "inventions",    label: "Inventions",    emoji: "💡", gradient: "linear-gradient(135deg,#f6d365,#fda085)" },
] as const;

export type CategoryId = (typeof CATEGORY_LIST)[number]["id"];
