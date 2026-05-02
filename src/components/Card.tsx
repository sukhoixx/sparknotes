"use client";

import type { PostWithCount } from "./Feed";
import { CATEGORY_LIST } from "@/lib/categories";
import type { AbVariant } from "@/hooks/useAbVariant";

interface CardProps {
  post: PostWithCount;
  liked: boolean;
  likeCount: number;
  variant: AbVariant;
  onLike: (e: React.MouseEvent) => void;
  onClick: () => void;
}

function formatNum(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

export default function Card({ post, liked, likeCount, variant, onLike, onClick }: CardProps) {
  const isLight = variant === "B";
  const catMeta = isLight ? CATEGORY_LIST.find((c) => c.id === post.category) : null;
  const gradient = catMeta?.lightGradient ?? post.gradient;

  return (
    <div
      className="card break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2 cursor-pointer shadow-sm transition-transform active:scale-[.97]"
      onClick={onClick}
    >
      <div
        className="w-full relative px-3 pt-8 pb-3 flex flex-col"
        style={{ background: gradient }}
      >
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px] backdrop-blur-sm ${
            isLight ? "bg-black/10 text-black/70" : "bg-black/40 text-white"
          }`}
        >
          {post.badge}
        </span>
        <p
          className={`font-bold text-[15px] leading-[1.4] drop-shadow-sm mb-3 ${
            isLight ? "text-gray-900" : "text-white"
          }`}
        >
          {post.title}
        </p>
        <div className="flex items-center gap-[6px]">
          <span className={`text-[11px] flex-1 ${isLight ? "text-black/50" : "text-white/70"}`}>
            {post._count.comments > 0 ? `${post._count.comments} comment${post._count.comments === 1 ? "" : "s"}` : ""}
          </span>
          <div className={`flex items-center gap-[3px] text-[11px] ${isLight ? "text-black/50" : "text-white/70"}`}>
            <button
              className="bg-transparent border-0 cursor-pointer text-base p-0"
              onClick={onLike}
              aria-label="Like"
            >
              {liked ? "❤️" : "🤍"}
            </button>
            <span>{formatNum(likeCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2">
      <div className="w-full bg-shimmer" style={{ height: `${100 + Math.random() * 60}px` }} />
      <div className="px-[10px] pb-3 pt-2 space-y-[6px]">
        <div className="h-3 rounded bg-shimmer w-full" />
        <div className="h-3 rounded bg-shimmer w-[65%]" />
        <div className="h-[10px] rounded bg-shimmer w-[50%] mt-2" />
      </div>
    </div>
  );
}
