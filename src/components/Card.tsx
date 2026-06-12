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
  const textColor = isLight ? "#2a2a2a" : "#f2f2f7";
  const faintColor = isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)";

  // Build reaction display from post.reactions map
  const reactionEntries = Object.entries((post.reactions as Record<string, number>) ?? {}).filter(([, n]) => n > 0);

  return (
    <div
      className="card break-inside-avoid rounded-[14px] overflow-hidden mb-2 cursor-pointer transition-transform active:scale-[.97]"
      style={{ background: surface, boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.07)" : "none" }}
      onClick={onClick}
    >
      {/* Badge — small, faint, top */}
      <div className="px-2 pt-[6px] pb-1">
        <span style={{ fontSize: 9, fontWeight: 600, color: faintColor }}>
          {badgeOverride ?? post.badge}
        </span>
      </div>

      {/* Image or gradient fallback */}
      {post.imageUrl ? (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full aspect-video" style={{ background: gradient }} />
      )}

      {/* Content */}
      <div className="px-[10px] pt-2 pb-[10px]" style={{ minHeight: 80 }}>
        <p className="font-bold leading-[1.35] mb-[10px]" style={{ fontSize: 14, color: textColor }}>
          {post.title}
        </p>

        {/* Footer — comments + reaction row */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 10, color: faintColor, flex: 1, marginRight: 4 }}>
            {post._count.comments > 0
              ? `${post._count.comments} comment${post._count.comments === 1 ? "" : "s"}`
              : ""}
          </span>

          {/* Reactions — show emoji+count pairs if any, else dim 😮 */}
          <button
            className="flex items-center gap-[3px] bg-transparent border-0 cursor-pointer p-0"
            onClick={onLike}
            aria-label="React"
          >
            {reactionEntries.length > 0
              ? reactionEntries.map(([emoji, count]) => (
                  <span key={emoji} className="flex items-center gap-[2px]">
                    <span style={{ fontSize: 14 }}>{emoji}</span>
                    <span style={{ fontSize: 10, color: faintColor }}>{formatNum(count)}</span>
                  </span>
                ))
              : <span style={{ fontSize: 14, opacity: 0.35 }}>😮</span>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="break-inside-avoid bg-white rounded-[14px] overflow-hidden mb-2" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ height: 14, margin: "6px 8px 4px", borderRadius: 4, width: "40%" }} className="bg-shimmer" />
      <div className="w-full aspect-video bg-shimmer" />
      <div className="px-[10px] pb-3 pt-2 space-y-[6px]">
        <div className="h-3 rounded bg-shimmer w-full" />
        <div className="h-3 rounded bg-shimmer w-[65%]" />
        <div className="h-[10px] rounded bg-shimmer w-[50%] mt-2" />
      </div>
    </div>
  );
}
