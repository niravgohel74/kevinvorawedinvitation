"use client";
import React from "react";
import { ShagunRecord } from "@/types/wedding";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";

interface ShagunDeleteModalProps {
  isOpen: boolean;
  record: ShagunRecord | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function ShagunDeleteModal({
  isOpen,
  record,
  onClose,
  onConfirm,
  isDeleting,
}: ShagunDeleteModalProps) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#FCFAF6] border border-[#E9E1D5] p-6 text-[#202020] shadow-2xl space-y-5">
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <Trash2 className="w-6 h-6" />
          </span>
          <div>
            <h3 className="font-editorial-serif text-2xl text-[#202020]">
              Delete Shagun Entry
            </h3>
            <p className="text-xs text-[#736B63]">
              Confirmation required to modify wedding ledger
            </p>
          </div>
        </div>

        {/* Gift Record Summary Card */}
        <div className="p-4 rounded-xl bg-white border border-[#E9E1D5] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#202020]">
              {record.guestName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                record.side === "groom"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {record.side === "groom" ? "Groom Side" : "Bride Side"}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-[#736B63]">Gift Amount:</span>
            <span className="text-xl font-bold font-editorial-serif text-[#202020]">
              ₹{Number(record.amount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="text-[11px] text-[#8C847B] border-t border-stone-100 pt-2 flex flex-wrap gap-x-4 gap-y-1">
            {record.relation && <span>Relation: {record.relation}</span>}
            {record.city && <span>City: {record.city}</span>}
            <span>Mode: {record.paymentMode?.toUpperCase()}</span>
          </div>
        </div>

        <p className="text-xs text-rose-700 bg-rose-50/70 p-3 rounded-lg border border-rose-200/80 leading-relaxed">
          ⚠️ Are you sure you want to permanently remove this entry? This action will adjust the total collected amounts for both families immediately.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors"
          >
            Cancel &amp; Keep
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold tracking-wider uppercase transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
