"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Feed from "@/components/Feed";
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
      <Feed
        category={category}
        searchQuery={searchQuery}
        initialPosts={[] as Post[]}
      />
    </>
  );
}
