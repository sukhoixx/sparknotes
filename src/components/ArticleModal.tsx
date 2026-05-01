"use client";

import { useEffect } from "react";
import type { Post } from "@prisma/client";

interface ArticleModalProps {
  post: Post | null;
  liked: boolean;
  onClose: () => void;
  onLike: () => void;
}

function formatNum(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

export default function ArticleModal({ post, liked, onClose, onLike }: ArticleModalProps) {
  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [post]);

  if (!post) return null;

  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[24px] w-full max-w-[480px] mx-auto max-h-[88vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mt-3" />

        {/* Header strip */}
        <div
          className="mx-4 mt-3 rounded-2xl px-4 pt-6 pb-4"
          style={{ background: post.gradient }}
        >
          <h1 className="text-white text-[18px] font-extrabold leading-[1.3] drop-shadow-sm">{post.title}</h1>
        </div>

        {/* Content */}
        <div className="p-4">
          <span className="inline-flex items-center gap-1 bg-gradient-to-br from-[#6c47ff] to-[#00b4d8] text-white text-[10px] font-bold px-[10px] py-[3px] rounded-[10px] mb-[14px]">
            ✨ AI Summary for Kids
          </span>

          {/* Body */}
          <div
            className="text-[15px] leading-[1.7] text-[#333] mb-4 [&>p]:mb-3"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* Fun fact */}
          <div
            className="bg-[#fff0f2] border-l-[3px] border-[#ff2442] rounded-r-[10px] px-[14px] py-[10px] my-[14px] text-[14px]"
            dangerouslySetInnerHTML={{ __html: post.funFact }}
          />

          {/* Tags */}
          <div className="flex flex-wrap gap-[6px] mb-4">
            {tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-[12px] px-[10px] py-1 rounded-[12px]">
                {tag}
              </span>
            ))}
          </div>

          {/* Author row */}
          <div className="flex items-center gap-[10px] py-[14px] border-t border-b border-gray-100 mb-3">
            <div
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[20px]"
              style={{ background: post.authorBg }}
            >
              {post.authorEmoji}
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold">{post.badge.split(" ").slice(1).join(" ")}</p>
              <p className="text-[12px] text-gray-400">AI-generated · AI-verified</p>
            </div>
            {post.sourceUrl && (
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff2442] border border-[#ff2442] rounded-[16px] px-4 py-[6px] text-[13px] font-bold"
              >
                Source
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-around py-2 pb-4">
            <button
              onClick={onLike}
              className="flex flex-col items-center gap-[3px] bg-none border-0 cursor-pointer text-[11px] text-gray-400"
            >
              <span className="text-[24px]">{liked ? "❤️" : "🤍"}</span>
              <span>{formatNum(post.likes + (liked ? 1 : 0))}</span>
            </button>
            <button className="flex flex-col items-center gap-[3px] bg-none border-0 cursor-pointer text-[11px] text-gray-400">
              <span className="text-[24px]">💬</span>
              <span>Comments</span>
            </button>
            <button className="flex flex-col items-center gap-[3px] bg-none border-0 cursor-pointer text-[11px] text-gray-400">
              <span className="text-[24px]">🔖</span>
              <span>Save</span>
            </button>
            <button className="flex flex-col items-center gap-[3px] bg-none border-0 cursor-pointer text-[11px] text-gray-400">
              <span className="text-[24px]">📤</span>
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
