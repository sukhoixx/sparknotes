"use client";

import { useEffect, useRef, useState } from "react";
import type { PostWithCount } from "./Feed";
import type { UserProfile } from "@/hooks/useProfile";

interface ArticleModalProps {
  post: PostWithCount | null;
  liked: boolean;
  likeCount: number;
  onClose: () => void;
  onLike: () => void;
  profile?: UserProfile | null;
  onProfileNeeded?: () => void;
}

interface Comment {
  id: number;
  text: string;
  screenName: string;
  createdAt: string;
}

function formatNum(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ArticleModal({ post, liked, likeCount, onClose, onLike, profile, onProfileNeeded }: ArticleModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
      fetch(`/api/posts/${post.id}/comments`)
        .then((r) => r.json())
        .then((d) => setComments(d.comments ?? []));
    } else {
      document.body.style.overflow = "";
      setComments([]);
      setDraft("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [post]);

  async function submitComment() {
    if (!post || !draft.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draft, screenName: profile?.screenName }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((prev) => [...prev, data.comment]);
      setDraft("");
    }
    setSubmitting(false);
  }

  if (!post) return null;

  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[24px] w-full max-w-[480px] mx-auto max-h-[88vh] overflow-y-auto scrollbar-none animate-slide-up">
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
          <div className="flex items-center gap-2 mb-[14px] mt-1">
            <span className="inline-flex items-center gap-1 bg-gradient-to-br from-[#6c47ff] to-[#00b4d8] text-white text-[10px] font-bold px-[10px] py-[3px] rounded-[10px]">
              ✨ AI Summary
            </span>
            <span className="text-[11px] text-gray-400">
              {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

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
              <span>{formatNum(likeCount)}</span>
            </button>
            <button
              onClick={() => inputRef.current?.focus()}
              className="flex flex-col items-center gap-[3px] bg-none border-0 cursor-pointer text-[11px] text-gray-400"
            >
              <span className="text-[24px]">💬</span>
              <span>{comments.length > 0 ? formatNum(comments.length) : "Comments"}</span>
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

          {/* Comments section */}
          <div className="border-t border-gray-100 pt-4">
            {/* Input or prompt */}
            {profile ? (
              <div className="flex gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                  style={{ background: "#ff2442" }}
                >
                  {profile.screenName[0].toUpperCase()}
                </div>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Write a comment…"
                  rows={2}
                  className="flex-1 bg-gray-100 rounded-[14px] px-[14px] py-2 text-[14px] text-gray-800 resize-none outline-none border-0"
                />
                <button
                  onClick={submitComment}
                  disabled={!draft.trim() || submitting}
                  className="self-end bg-[#ff2442] text-white border-0 rounded-[14px] px-4 py-2 text-[13px] font-bold cursor-pointer disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            ) : (
              <button
                onClick={onProfileNeeded}
                className="w-full mb-4 bg-gray-100 rounded-[14px] px-[14px] py-3 text-[14px] text-gray-400 border-0 cursor-pointer text-left"
              >
                👤 Create a profile to comment…
              </button>
            )}

            {/* List */}
            {comments.length === 0 ? (
              <p className="text-center text-gray-400 text-[13px] py-4">No comments yet — be the first!</p>
            ) : (
              <div className="flex flex-col gap-3 pb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ff2442] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                      {c.screenName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-semibold text-gray-600 mb-[2px] ml-[4px]">{c.screenName}</p>
                      <div className="bg-gray-100 rounded-[14px] px-[12px] py-[8px] text-[14px] text-gray-800">{c.text}</div>
                      <p className="text-[11px] text-gray-400 mt-1 ml-[4px]">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
