"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type { Post } from "@prisma/client";
import Card, { CardSkeleton } from "./Card";
import ArticleModal from "./ArticleModal";

interface PageData {
  posts: Post[];
  nextCursor: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(category: string, searchQuery: string, cursor: string | null) {
  if (searchQuery) {
    const params = new URLSearchParams({ q: searchQuery });
    if (cursor) params.set("cursor", cursor);
    return `/api/search?${params}`;
  }
  const params = new URLSearchParams({ category });
  if (cursor) params.set("cursor", cursor);
  return `/api/posts?${params}`;
}

interface FeedProps {
  category: string;
  searchQuery: string;
  initialPosts: Post[];
}

export default function Feed({ category, searchQuery, initialPosts }: FeedProps) {
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getKey = useCallback(
    (pageIndex: number, previousPageData: PageData | null): string | null => {
      if (previousPageData && !previousPageData.nextCursor) return null;
      const cursor = pageIndex === 0 ? null : (previousPageData?.nextCursor ?? null);
      return buildUrl(category, searchQuery, cursor);
    },
    [category, searchQuery]
  );

  const { data, setSize, isValidating } = useSWRInfinite<PageData>(getKey, fetcher, {
    fallbackData: searchQuery || category !== "all" ? undefined : [{ posts: initialPosts, nextCursor: initialPosts.length >= 12 ? String(initialPosts[initialPosts.length - 1]?.id) : null }],
    revalidateFirstPage: false,
  });

  const posts = data ? data.flatMap((p) => p.posts) : [];
  const isLoadingMore = isValidating;
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : true;

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
    async (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      const wasLiked = liked.has(post.id);
      setLiked((prev) => {
        const next = new Set(prev);
        wasLiked ? next.delete(post.id) : next.add(post.id);
        return next;
      });
      if (!wasLiked) {
        await fetch(`/api/posts/${post.id}/like`, { method: "POST" }).catch(() => {});
      }
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
    if (!wasLiked) {
      fetch(`/api/posts/${openPost.id}/like`, { method: "POST" }).catch(() => {});
    }
  }, [openPost, liked]);

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 gap-2 px-2 pb-24 pt-[6px]">
        {posts.map((post) => (
          <Card
            key={post.id}
            post={post}
            liked={liked.has(post.id)}
            onLike={(e) => handleLike(e, post)}
            onClick={() => setOpenPost(post)}
          />
        ))}

        {/* Skeleton cards while loading */}
        {isLoadingMore && (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}
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
          Generating more stories…
        </div>
      )}

      {/* Article modal */}
      <ArticleModal
        post={openPost}
        liked={openPost ? liked.has(openPost.id) : false}
        onClose={() => setOpenPost(null)}
        onLike={handleModalLike}
      />
    </>
  );
}
