"use client";
import React, { useState, useEffect } from "react";
import { GuestWishRecord } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { MessageSquareHeart, Send, Check } from "lucide-react";

interface WishesSectionProps {
  initialWishes?: GuestWishRecord[];
}

export function WishesSection({ initialWishes = [] }: WishesSectionProps) {
  const [wishes, setWishes] = useState<GuestWishRecord[]>(initialWishes);

  useEffect(() => {
    setWishes(initialWishes);
  }, [initialWishes]);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setErrorMsg("Please provide both your name and a blessing message.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedNotice(true);
        setName("");
        setMessage("");
      } else {
        setErrorMsg(data.error || "Failed to submit blessing.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="wishes" className="relative py-24 sm:py-32 bg-[#F8F5EF] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16 sm:mb-20">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Warm Wishes
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            Blessings &amp; Love
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          <p className="text-xs sm:text-sm text-[#736B63] font-light">
            Leave a note of congratulations and warmth for the couple.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12">
          {/* Form Column */}
          <div className="lg:col-span-5">
            <div className="p-7 sm:p-8 rounded-3xl bg-[#FCFAF6] border border-[#C9B38C]/35 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#9E814D]">
                <MessageSquareHeart className="w-4 h-4" />
                <span>Write a Blessing</span>
              </div>

              {submittedNotice ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#E9E1D5] text-[#9E814D] flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-editorial-serif text-2xl text-[#202020]">Thank You</h4>
                  <p className="text-xs text-[#736B63] font-light leading-relaxed">
                    Your blessing has been sent and will appear here shortly after review.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedNotice(false)}
                    className="text-xs text-[#9E814D] underline font-medium"
                  >
                    Write another note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="wish-name" className="text-xs font-medium text-[#5A524A] uppercase tracking-wider block">
                      Your Name
                    </label>
                    <input
                      id="wish-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul & Priya"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] placeholder-[#A8A096] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="wish-msg" className="text-xs font-medium text-[#5A524A] uppercase tracking-wider block">
                      Your Wish
                    </label>
                    <textarea
                      id="wish-msg"
                      rows={3}
                      required
                      placeholder="May your life together always be filled with laughter..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] placeholder-[#A8A096] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full bg-[#202020] text-[#FCFAF6] text-xs font-medium tracking-[0.2em] uppercase hover:bg-[#38332E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-[#C9B38C]" />
                    <span>{loading ? "Sending..." : "Send Blessing"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Approved Wishes Wall */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-[#9E814D] mb-4">
              Celebration Guestbook
            </h3>

            {wishes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FCFAF6] border border-[#E9E1D5] text-center text-xs text-[#8C847B] font-light">
                Be the first to leave a blessing for the couple!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                {wishes.map((w) => (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/25 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <p className="font-editorial-serif text-sm sm:text-base italic text-[#4A443E] leading-relaxed">
                      &ldquo;{w.message}&rdquo;
                    </p>
                    <div className="pt-2 border-t border-[#E9E1D5]/60 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#202020] tracking-wide">
                        — {w.name}
                      </span>
                      <span className="text-[10px] text-[#A8A096]">
                        {new Date(w.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
