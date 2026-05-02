"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type { Post } from "@prisma/client";

export type PostWithCount = Post & { _count: { comments: number } };

import Card, { CardSkeleton } from "./Card";
import ArticleModal from "./ArticleModal";
import type { UserProfile } from "@/hooks/useProfile";
import { useAbVariant } from "@/hooks/useAbVariant";

interface PageData {
  posts: PostWithCount[];
  nextCursor: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(category: string, searchQuery: string, cursor: string | null, cats?: string) {
  if (searchQuery) {
    const params = new URLSearchParams({ q: searchQuery });
    if (cursor) params.set("cursor", cursor);
    return `/api/search?${params}`;
  }
  const params = new URLSearchParams({ category });
  if (cursor) params.set("cursor", cursor);
  if (category === "all" && cats) params.set("cats", cats);
  return `/api/posts?${params}`;
}

interface FeedProps {
  category: string;
  searchQuery: string;
  initialPosts: PostWithCount[];
  profile?: UserProfile | null;
}

export default function Feed({ category, searchQuery, initialPosts, profile }: FeedProps) {
  const variant = useAbVariant();
  const [openPost, setOpenPost] = useState<PostWithCount | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  function getLikeCount(post: PostWithCount) {
    return likeCounts[post.id] ?? post.likes;
  }

  // Load liked post IDs from server on mount so likes persist across reloads
  useEffect(() => {
    fetch("/api/me/likes")
      .then((r) => r.json())
      .then((d) => { if (d.likedPostIds?.length) setLiked(new Set(d.likedPostIds)); })
      .catch(() => {});
  }, []);

  const cats = profile?.categories?.length ? profile.categories.join(",") : undefined;

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PageData | null): string | null => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = pageIndex === 0 ? null : (previousPageData?.nextCursor ?? null);
      return buildUrl(category, searchQuery, cursor, cats);
    },
    [category, searchQuery, cats]
  );

  const { data, setSize, isValidating } = useSWRInfinite<PageData>(getKey, fetcher, {
    fallbackData:
      searchQuery || category !== "all"
        ? undefined
        : [{ posts: initialPosts, nextCursor: initialPosts.length >= 12 ? "1" : null }],
    revalidateFirstPage: false,
  });

  const posts: PostWithCount[] = data ? data.flatMap((p) => p.posts) : [];
  const isLoadingMore = isValidating;
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : true;

  // Split into two independent column arrays — new posts append without causing reflow
  const leftPosts = posts.filter((_, i) => i % 2 === 0);
  const rightPosts = posts.filter((_, i) => i % 2 === 1);

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, setSize]);

  const handleLike = useCallback(
    async (e: React.MouseEvent, post: PostWithCount) => {
      e.stopPropagation();
      const wasLiked = liked.has(post.id);
      setLiked((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(post.id) : next.add(post.id);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [post.id]: (prev[post.id] ?? post.likes) + (wasLiked ? -1 : 1),
      }));
      fetch(`/api/posts/${post.id}/like`, { method: wasLiked ? "DELETE" : "POST" }).catch(() => {});
    },
    [liked]
  );

  const handleModalLike = useCallback(() => {
    if (!openPost) return;
    const wasLiked = liked.has(openPost.id);
    setLiked((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(openPost.id) : next.add(openPost.id);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [openPost.id]: (prev[openPost.id] ?? openPost.likes) + (wasLiked ? -1 : 1),
    }));
    fetch(`/api/posts/${openPost.id}/like`, { method: wasLiked ? "DELETE" : "POST" }).catch(() => {});
  }, [openPost, liked]);

  const renderCard = (post: PostWithCount) => (
    <Card
      key={post.id}
      post={post}
      liked={liked.has(post.id)}
      likeCount={getLikeCount(post)}
      variant={variant}
      onLike={(e) => handleLike(e, post)}
      onClick={() => setOpenPost(post)}
    />
  );

  return (
    <>
      {/* Two explicit columns — appending to one never reflows the other */}
      <div className="flex gap-2 px-2 pb-24 pt-[6px]">
        <div className="flex-1 flex flex-col gap-2">
          {leftPosts.map(renderCard)}
          {isLoadingMore && <CardSkeleton />}
          {isLoadingMore && <CardSkeleton />}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {rightPosts.map(renderCard)}
          {isLoadingMore && <CardSkeleton />}
          {isLoadingMore && <CardSkeleton />}
        </div>
      </div>

      {/* Empty state */}
      {!isLoadingMore && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-[14px] gap-2">
          <span className="text-[48px]">📭</span>
          {searchQuery ? `No results for "${searchQuery}"` : "No posts yet — check back soon!"}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center gap-2 py-4 text-[13px] text-gray-400">
          <div className="w-[18px] h-[18px] border-[2.5px] border-gray-200 border-t-[#ff2442] rounded-full animate-spin" />
          Loading more…
        </div>
      )}

      {/* Article modal */}
      <ArticleModal
        post={openPost}
        liked={openPost ? liked.has(openPost.id) : false}
        likeCount={openPost ? getLikeCount(openPost) : 0}
        onClose={() => setOpenPost(null)}
        onLike={handleModalLike}
        profile={profile}
      />
    </>
  );
}
