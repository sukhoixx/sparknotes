"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Feed from "@/components/Feed";
import ProfileModal from "@/components/ProfileModal";
import SignInModal from "@/components/SignInModal";
import { useProfile } from "@/hooks/useProfile";
import { useAbVariant } from "@/hooks/useAbVariant";
import type { PostWithCount } from "@/components/Feed";

export default function HomePage() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { profile, loading, isAuthenticated, saveProfile } = useProfile();
  const variant = useAbVariant();

  // Paint the full browser chrome (overscroll area, html/body) to match the variant
  useEffect(() => {
    const color = variant === "A" ? "#111111" : "#ffffff";
    document.documentElement.style.background = color;
    document.body.style.background = color;
    return () => {
      document.documentElement.style.background = "";
      document.body.style.background = "";
    };
  }, [variant]);

  // Auto-open profile setup after first sign-in
  useEffect(() => {
    if (!loading && isAuthenticated && !profile) setProfileOpen(true);
  }, [loading, isAuthenticated, profile]);

  function handleProfileClick() {
    if (!isAuthenticated) setSignInOpen(true);
    else setProfileOpen(true);
  }

  return (
    <div className={variant === "A" ? "min-h-screen bg-[#111111]" : "min-h-screen bg-white"}>
      <Header
        category={category}
        onCategoryChange={(cat) => {
          setCategory(cat);
          setSearchQuery("");
        }}
        onSearch={setSearchQuery}
        profile={profile}
        onProfileClick={handleProfileClick}
        variant={variant}
      />
      <Feed
        category={category}
        searchQuery={searchQuery}
        initialPosts={[] as PostWithCount[]}
        profile={profile}
        variant={variant}
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
    </div>
  );
}
