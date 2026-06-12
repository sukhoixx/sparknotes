"use client";

import type { PostWithCount } from "./Feed";
import { CATEGORY_LIST } from "@/lib/categories";
import type { AbVariant } from "@/hooks/useAbVariant";

interface CardProps {
  post: PostWithCount;
  liked: boolean;
  likeCount: number;
  variant: AbVariant;
  badgeOverride?: string;
  onLike: (e: React.MouseEvent) => void;
  onClick: () => void;
}

function formatNum(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

export default function Card({ post, liked, likeCount, variant, badgeOverride, onLike, onClick }: CardProps) {
  const isLight = variant === "B";
  const catMeta = CATEGORY_LIST.find((c) => c.id === post.category);
  const gradient = isLight
    ? (catMeta?.lightGradient ?? post.gradient)
    : (catMeta?.darkGradient ?? post.gradient);

  const surface = isLight ? "#ffffff" : "#1c1c1e";
  const textColor = isLight ? "#1a1a1a" : "#f2f2f7";
  const faintColor = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";

  return (
    <div
      className="card break-inside-avoid rounded-[14px] overflow-hidden mb-2 cursor-pointer shadow-sm transition-transform active:scale-[.97]"
      style={{ background: surface }}
      onClick={onClick}
    >
      {/* Badge */}
      <div className="px-2 pt-[6px] pb-[4px]" style={{ background: surface }}>
        <span className="text-[9px] font-semibold" style={{ color: faintColor }}>
          {badgeOverride ?? post.badge}
        </span>
      </div>

      {/* Image or gradient fallback */}
      {post.imageUrl ? (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full object-cover"
          style={{ height: 120, display: "block" }}
          loading="lazy"
        />
      ) : (
        <div className="w-full" style={{ height: 120, background: gradient }} />
      )}

      {/* Title + footer */}
      <div className="px-[10px] pt-2 pb-[10px]" style={{ minHeight: 80 }}>
        <p className="font-bold text-[14px] leading-[1.35] mb-[10px]" style={{ color: textColor }}>
          {post.title}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] flex-1 mr-1" style={{ color: faintColor }}>
            {post._count.comments > 0 ? `${post._count.comments} comment${post._count.comments === 1 ? "" : "s"}` : ""}
          </span>
          <div className="flex items-center gap-[3px] text-[11px]">
            <button
              className="bg-transparent border-0 cursor-pointer text-[14px] p-0"
              onClick={onLike}
              aria-label="Like"
              style={{ color: faintColor }}
            >
              {liked ? "❤️" : "🤍"}
            </button>
            <span className="text-[10px]" style={{ color: faintColor }}>{formatNum(likeCount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2">
      <div className="w-full bg-shimmer" style={{ height: 14, margin: "6px 8px 4px", borderRadius: 4, width: "40%" }} />
      <div className="w-full bg-shimmer" style={{ height: 120 }} />
      <div className="px-[10px] pb-3 pt-2 space-y-[6px]">
        <div className="h-3 rounded bg-shimmer w-full" />
        <div className="h-3 rounded bg-shimmer w-[65%]" />
        <div className="h-[10px] rounded bg-shimmer w-[50%] mt-2" />
      </div>
    </div>
  );
}
