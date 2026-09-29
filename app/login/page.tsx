"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setErrorMsg(data.error || "Authentication failed.");
      }
    } catch {
      setErrorMsg("An error occurred during sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#161514] text-[#FAF8F5] relative overflow-hidden">
      {/* Ambient background aura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2D2823] via-[#1A1816] to-[#0E0D0C]" />
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />

      {/* Decorative Ornaments */}
      <div className="absolute top-10 left-10 pointer-events-none opacity-40">
        <BotanicalMotif variant="corner" className="w-12 h-12 text-[#C9B38C]" />
      </div>
      <div className="absolute bottom-10 right-10 pointer-events-none opacity-40">
        <BotanicalMotif variant="corner" className="w-12 h-12 text-[#C9B38C] -scale-100" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#1F1D1B] border border-[#C9B38C]/35 p-8 sm:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-center space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-full border border-[#C9B38C]/40 bg-[#2A2622] text-[#C9B38C] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          
          <div className="space-y-1">
            <span className="text-[11px] font-semibold tracking-[0.35em] text-[#C9B38C] uppercase">
              Private Access
            </span>
            <h1 className="font-editorial-serif text-3xl sm:text-4xl text-white font-normal">
              Manage Your Wedding
            </h1>
          </div>
          
          <p className="text-xs text-[#A8A096] font-light">
            Sign in to access the wedding administration portal.
          </p>

          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs text-left">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#C9B38C] uppercase tracking-wider block">
              Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 rounded-xl bg-[#2A2622] border border-[#C9B38C]/30 text-white placeholder-[#736B63] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/60 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#C9B38C] uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl bg-[#2A2622] border border-[#C9B38C]/30 text-white placeholder-[#736B63] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/60 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#736B63] hover:text-[#C9B38C] transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#C9B38C] text-[#161514] font-semibold text-xs sm:text-sm tracking-[0.25em] uppercase hover:bg-[#E5D3B3] transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Verifying..." : "ENTER"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-4 border-t border-[#C9B38C]/20 flex justify-center">
          <Link
            href="/"
            className="text-xs text-[#A8A096] hover:text-[#C9B38C] tracking-wider uppercase transition-colors"
          >
            ← Return to Invitation
          </Link>
        </div>
      </div>
    </main>
  );
}
