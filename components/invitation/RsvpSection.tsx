"use client";
import React, { useState } from "react";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import confetti from "canvas-confetti";
import { Check, HeartHandshake } from "lucide-react";

export function RsvpSection() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    guestsCount: 1,
    attending: "yes" as "yes" | "no",
    dietaryPreference: "Vegetarian",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setResponseMsg(data.message || "Thank you for confirming your presence!");

        if (form.attending === "yes") {
          try {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#C9B38C", "#D4AF37", "#B58F8F"],
            });
          } catch {
            // fallback
          }
        }
      } else {
        setErrorMsg(data.error || "Unable to submit RSVP. Please try again.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="rsvp" className="relative py-24 sm:py-32 bg-[#FFFCF7] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Kindly Respond
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl font-normal tracking-wide text-[#202020]">
            RSVP
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          <p className="text-xs sm:text-sm text-[#736B63] font-light">
            Please let us know if you will celebrate with us by 1st December 2026.
          </p>
        </div>

        {/* RSVP Card */}
        <div className="rounded-3xl bg-[#FCFAF6] border border-[#C9B38C]/40 p-7 sm:p-10 shadow-[0_15px_35px_-10px_rgba(201,179,140,0.15)] relative">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E9E1D5] text-[#9E814D] flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="font-editorial-serif text-3xl text-[#202020]">
                Response Received
              </h3>
              <p className="text-sm text-[#665E55] font-light max-w-sm mx-auto leading-relaxed">
                {responseMsg}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    phone: "",
                    guestsCount: 1,
                    attending: "yes",
                    dietaryPreference: "Vegetarian",
                    message: "",
                  });
                }}
                className="mt-6 text-xs text-[#9E814D] underline underline-offset-4 tracking-wider uppercase font-medium hover:text-[#202020]"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Attendance Choice Buttons */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                  Will you attend? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, attending: "yes" })}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-medium tracking-wider uppercase transition-all duration-300 border flex items-center justify-center gap-2 ${
                      form.attending === "yes"
                        ? "bg-[#202020] text-[#FCFAF6] border-[#202020] shadow-sm"
                        : "bg-[#F8F5EF] text-[#736B63] border-[#E9E1D5] hover:border-[#C9B38C]"
                    }`}
                  >
                    <span>Joyfully Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, attending: "no" })}
                    className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-medium tracking-wider uppercase transition-all duration-300 border flex items-center justify-center gap-2 ${
                      form.attending === "no"
                        ? "bg-[#665E55] text-white border-[#665E55] shadow-sm"
                        : "bg-[#F8F5EF] text-[#736B63] border-[#E9E1D5] hover:border-[#C9B38C]"
                    }`}
                  >
                    <span>Regretfully Decline</span>
                  </button>
                </div>
              </div>

              {/* Guest Name */}
              <div className="space-y-1.5">
                <label htmlFor="rsvp-name" className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="rsvp-name"
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] placeholder-[#A8A096] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="rsvp-phone" className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                  Phone Number
                </label>
                <input
                  id="rsvp-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] placeholder-[#A8A096] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 transition-all"
                />
              </div>

              {/* Number of Guests & Dietary Preference */}
              {form.attending === "yes" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="rsvp-guests" className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                      Number of Guests
                    </label>
                    <select
                      id="rsvp-guests"
                      value={form.guestsCount}
                      onChange={(e) => setForm({ ...form, guestsCount: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 transition-all"
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                      <option value={5}>5+ Guests</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="rsvp-diet" className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                      Dietary Preference
                    </label>
                    <select
                      id="rsvp-diet"
                      value={form.dietaryPreference}
                      onChange={(e) => setForm({ ...form, dietaryPreference: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 transition-all"
                    >
                      <option value="Vegetarian">Pure Vegetarian</option>
                      <option value="Jain">Jain Friendly</option>
                      <option value="Vegan">Vegan</option>
                      <option value="None">No Dietary Preference</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Warm Message */}
              <div className="space-y-1.5">
                <label htmlFor="rsvp-message" className="block text-xs uppercase tracking-wider font-semibold text-[#5A524A]">
                  Note for the Couple
                </label>
                <textarea
                  id="rsvp-message"
                  rows={3}
                  placeholder="Share a sweet memory or blessing..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#C9B38C]/40 bg-[#FFFFFF] text-sm text-[#202020] placeholder-[#A8A096] focus:outline-none focus:ring-2 focus:ring-[#C9B38C]/50 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#202020] text-[#FCFAF6] text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold hover:bg-[#342F2A] transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <HeartHandshake className="w-4 h-4 text-[#C9B38C]" />
                <span>{loading ? "Sending..." : "Submit RSVP"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
