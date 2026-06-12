export interface Post {
  id: number;
  title: string;
  body: string;
  funFact: string;
  tags: unknown;
  category: string;
  badge: string;
  authorEmoji: string;
  authorBg: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  gradient: string;
  reactions?: Record<string, number>;
  createdAt: string;
  publishedAt: string;
}
