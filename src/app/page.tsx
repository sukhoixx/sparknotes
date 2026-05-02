"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Feed from "@/components/Feed";
import ProfileModal from "@/components/ProfileModal";
import { useProfile } from "@/hooks/useProfile";
import type { PostWithCount } from "@/components/Feed";

export default function HomePage() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile, loading, deviceId, saveProfile } = useProfile();

  return (
    <>
      <Header
        category={category}
        onCategoryChange={(cat) => {
          setCategory(cat);
          setSearchQuery("");
        }}
        onSearch={setSearchQuery}
        profile={profile}
        onProfileClick={() => setProfileOpen(true)}
      />
      <Feed
        category={category}
        searchQuery={searchQuery}
        initialPosts={[] as PostWithCount[]}
        profile={profile}
      />
      {profileOpen && !loading && (
        <ProfileModal
          profile={profile}
          deviceId={deviceId}
          onSave={saveProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
