"use client";

import { useState } from "react";
import Header from "@/components/Header";
import StoryRow from "@/components/StoryRow";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@prisma/client";

export default function HomePage() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <Header
        category={category}
        onCategoryChange={(cat) => {
          setCategory(cat);
          setSearchQuery("");
        }}
        onSearch={setSearchQuery}
      />
      {!searchQuery && <StoryRow />}
      <Feed
        category={category}
        searchQuery={searchQuery}
        initialPosts={[] as Post[]}
      />
      <BottomNav />
    </>
  );
}
