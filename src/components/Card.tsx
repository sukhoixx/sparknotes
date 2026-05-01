"use client";

import type { Post } from "@prisma/client";

interface CardProps {
  post: Post;
  liked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onClick: () => void;
}

function formatNum(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

export default function Card({ post, liked, onLike, onClick }: CardProps) {
  return (
    <div
      className="card break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2 cursor-pointer shadow-sm transition-transform active:scale-[.97]"
      onClick={onClick}
    >
      {/* Title banner — variable height drives the masonry stagger */}
      <div
        className="w-full relative px-3 pt-8 pb-4"
        style={{ background: post.gradient }}
      >
        <span className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px] backdrop-blur-sm">
          {post.badge}
        </span>
        <p className="text-white font-bold text-[15px] leading-[1.4] drop-shadow-sm">
          {post.title}
        </p>
      </div>

      {/* Snippet + meta */}
      <div className="px-[10px] pb-[10px] pt-2">
        <p className="text-[12px] text-gray-500 leading-[1.4] line-clamp-2 mb-2">
          {post.snippet}
        </p>
        <div className="flex items-center gap-[6px]">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[12px] shrink-0"
            style={{ background: post.authorBg }}
          >
            {post.authorEmoji}
          </div>
          <span className="text-[11px] text-gray-400 flex-1 truncate">
            {post.badge.split(" ").slice(1).join(" ")}
          </span>
          <div className="flex items-center gap-[3px] text-[11px] text-gray-400">
            <button
              className="bg-transparent border-0 cursor-pointer text-base p-0"
              onClick={onLike}
              aria-label="Like"
            >
              {liked ? "❤️" : "🤍"}
            </button>
            <span>{formatNum(post.likes + (liked ? 1 : 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2">
      {/* Vary skeleton heights to mimic the stagger */}
      <div className="w-full bg-shimmer" style={{ height: `${100 + Math.random() * 60}px` }} />
      <div className="px-[10px] pb-3 pt-2 space-y-[6px]">
        <div className="h-3 rounded bg-shimmer w-full" />
        <div className="h-3 rounded bg-shimmer w-[65%]" />
        <div className="h-[10px] rounded bg-shimmer w-[50%] mt-2" />
      </div>
    </div>
  );
}
