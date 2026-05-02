"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Feed from "@/components/Feed";
import ProfileModal from "@/components/ProfileModal";
import SignInModal from "@/components/SignInModal";
import { useProfile } from "@/hooks/useProfile";
import type { PostWithCount } from "@/components/Feed";

export default function HomePage() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { profile, loading, isAuthenticated, saveProfile } = useProfile();

  // Auto-open profile setup after first sign-in
  useEffect(() => {
    if (!loading && isAuthenticated && !profile) setProfileOpen(true);
  }, [loading, isAuthenticated, profile]);

  function handleProfileClick() {
    if (!isAuthenticated) setSignInOpen(true);
    else setProfileOpen(true);
  }

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
        onProfileClick={handleProfileClick}
      />
      <Feed
        category={category}
        searchQuery={searchQuery}
        initialPosts={[] as PostWithCount[]}
        profile={profile}
      />
      {signInOpen && (
        <SignInModal onClose={() => setSignInOpen(false)} />
      )}
      {profileOpen && isAuthenticated && (
        <ProfileModal
          profile={profile}
          onSave={saveProfile}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  );
}
