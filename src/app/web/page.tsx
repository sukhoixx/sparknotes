"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Feed from "@/components/Feed";
import ProfileModal from "@/components/ProfileModal";
import SignInModal from "@/components/SignInModal";
import { useProfile } from "@/hooks/useProfile";
import type { PostWithCount } from "@/components/Feed";

const MAX_WIDTH = 720;

export default function WebPage() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { profile, loading, isAuthenticated, saveProfile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const orig = {
      bodyMax: body.style.maxWidth,
      bodyMargin: body.style.margin,
      bodyBg: body.style.background,
      htmlBg: html.style.background,
    };
    body.style.maxWidth = "none";
    body.style.margin = "0";
    body.style.background = "#f5f5f7";
    html.style.background = "#f5f5f7";
    return () => {
      body.style.maxWidth = orig.bodyMax;
      body.style.margin = orig.bodyMargin;
      body.style.background = orig.bodyBg;
      html.style.background = orig.htmlBg;
    };
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated && !profile) setProfileOpen(true);
  }, [loading, isAuthenticated, profile]);

  function handleProfileClick() {
    if (!isAuthenticated) setSignInOpen(true);
    else setProfileOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <Header
          category={category}
          onCategoryChange={(cat) => {
            setCategory(cat);
            setSearchQuery("");
          }}
          onSearch={setSearchQuery}
          profile={profile}
          onProfileClick={handleProfileClick}
          variant="B"
          iosStyle
        />
        <Feed
          category={category}
          searchQuery={searchQuery}
          initialPosts={[] as PostWithCount[]}
          profile={profile}
          variant="B"
          onCardClick={(post) => router.push(`/web/posts/${post.id}`)}
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
    </div>
  );
}
