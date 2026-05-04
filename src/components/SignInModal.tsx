"use client";

import { signIn } from "next-auth/react";

interface SignInModalProps {
  onClose: () => void;
}

export default function SignInModal({ onClose }: SignInModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[300] flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-[24px] w-full max-w-[480px] mx-auto animate-slide-up">
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mt-3" />
        <div className="px-5 pt-4 pb-8">
          <h2 className="text-[18px] font-extrabold text-gray-900 mb-1">Join NewsBlock</h2>
          <p className="text-[13px] text-gray-400 mb-6">Sign in to personalize your feed and comment on stories.</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-[16px] py-[13px] mb-3 text-[15px] font-semibold text-gray-800 cursor-pointer shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.8 7.3 29.1 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.5-.2-2.9-.4-4.5z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.8 7.3 29.1 5 24 5 16.3 5 9.6 9.2 6.3 14.7z"/><path fill="#FBBC05" d="M24 45c5 0 9.7-1.7 13.3-4.5l-6.1-5.2C29.4 36.8 26.8 38 24 38c-5.2 0-9.6-3.4-11.2-8.1l-6.5 5C9.7 41 16.4 45 24 45z"/><path fill="#EA4335" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.1 5.2C41 35.7 44 31 44 25c0-1.5-.2-2.9-.4-4.5z"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => signIn("apple", { callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-black rounded-[16px] py-[13px] text-[15px] font-semibold text-white cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
}
