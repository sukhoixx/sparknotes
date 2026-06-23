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

export default function WebFeed({ initialPosts }: { initialPosts: PostWithCount[] }) {
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

  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f7]" style={{ position: "relative" }}>
      {/* Left sidebar ad */}
      <div style={{
        position: "fixed", top: 120, left: "calc(50% - 360px - 170px)",
        width: 160, zIndex: 10,
      }} className="hidden xl:block">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: 160, height: 600 }}
          data-ad-client="ca-pub-2618352557321545"
          data-ad-slot="3829122849"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Right sidebar ad */}
      <div style={{
        position: "fixed", top: 120, left: "calc(50% + 360px + 10px)",
        width: 160, zIndex: 10,
      }} className="hidden xl:block">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: 160, height: 600 }}
          data-ad-client="ca-pub-2618352557321545"
          data-ad-slot="3829122849"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      <div style={{ maxWidth: MAX_WIDTH, margin: "0 auto" }}>
        <Header
          category={category}
          onCategoryChange={(cat) => {
            setCategory(cat);
            setSearchQuery("");
          }}
          onSearch={setSearchQuery}
          profile={profile}
          onProfileClick={() => setProfileOpen(true)}
          variant="B"
          iosStyle
        />
        <Feed
          category={category}
          searchQuery={searchQuery}
          initialPosts={initialPosts}
          profile={profile}
          variant="B"
          onCardClick={(post) => router.push(`/web/posts/${post.id}`)}
          showAds={true}
        />
        {signInOpen && (
          <SignInModal onClose={() => setSignInOpen(false)} />
        )}
        {profileOpen && (
          <ProfileModal
            profile={profile}
            onSave={saveProfile}
            onClose={() => setProfileOpen(false)}
            isAuthenticated={isAuthenticated}
            onSignIn={() => { setProfileOpen(false); setSignInOpen(true); }}
          />
        )}
      </div>
    </div>
  );
}
