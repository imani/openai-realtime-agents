"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: "thinking" | "speaking" | "listening" | "silent";
  setVoiceState: React.Dispatch<
    React.SetStateAction<"thinking" | "speaking" | "listening" | "silent">
  >;
  transcribedText: string;
  setTranscribedText: React.Dispatch<React.SetStateAction<string>>;
  aiResponse: string;
  setAiResponse: React.Dispatch<React.SetStateAction<string>>;
  isAiTyping: boolean;
  setIsAiTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function VoiceChatModal({
  isOpen,
  onClose,
  currentState,
  transcribedText,
  aiResponse,
  isAiTyping,
  setAiResponse,
  setIsAiTyping,
  setTranscribedText,
  setVoiceState,
}: VoiceChatModalProps) {
  const [typedAi, setTypedAi] = useState("");
  const typeIntervalRef = useRef<number | null>(null);

  const colors = useMemo(
    () => ({
      thinking: "#6b7280",
      speaking: "#06b6d4",
      listening: "#f59e0b",
      silent: "#9ca3af",
    }),
    []
  );

  useEffect(() => {
    if (typeIntervalRef.current) {
      window.clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }

    if (isAiTyping) {
      setTypedAi("");
      let i = 0;
      const len = aiResponse?.length ?? 0;
      const speed = Math.max(
        8,
        Math.min(30, Math.floor(800 / Math.max(1, len)))
      );

      typeIntervalRef.current = window.setInterval(() => {
        i += 1;
        setTypedAi(aiResponse.slice(0, i));
        if (i >= len) {
          window.clearInterval(typeIntervalRef.current!);
          typeIntervalRef.current = null;
        }
      }, speed);
    } else {
      setTypedAi(aiResponse ?? "");
    }

    return () => {
      if (typeIntervalRef.current) {
        window.clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
    };
  }, [aiResponse, isAiTyping]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rings = [
    { size: 300, blur: 30, delay: "0s" },
    { size: 420, blur: 36, delay: "0.3s" },
    { size: 540, blur: 44, delay: "0.6s" },
  ];

  const centralSize = 120;
  const mainColor = colors[currentState];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md md:hidden animate-fade-in"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close voice modal"
        className="absolute top-5 left-5 p-2 rounded-full bg-gray-100 shadow hover:bg-gray-200 transition"
      >
        <Cross2Icon className="w-5 h-5 text-gray-600" />
      </button>

      {/* Voice Visualization */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div
          className="relative flex items-center justify-center"
          style={{
            width: rings[rings.length - 1].size,
            height: rings[rings.length - 1].size,
          }}
        >
          {rings.map((r, idx) => (
            <div
              key={idx}
              className={`absolute rounded-full pointer-events-none ${
                currentState === "speaking"
                  ? "animate-wave-speaking"
                  : currentState === "listening"
                  ? "animate-wave-listening"
                  : currentState === "thinking"
                  ? "animate-wave-thinking"
                  : ""
              }`}
              style={{
                width: r.size,
                height: r.size,
                animationDelay: r.delay,
                boxShadow: `0 0 ${r.blur}px ${mainColor}33`,
                border: `2px solid ${mainColor}33`,
                background: `radial-gradient(circle at center, ${mainColor}22, transparent 45%)`,
              }}
            />
          ))}

          {/* Center Circle */}
          <div
            className={`flex items-center justify-center rounded-full shadow-xl ${
              currentState === "speaking"
                ? "animate-center-speaking"
                : currentState === "listening"
                ? "animate-center-listening"
                : currentState === "thinking"
                ? "animate-center-thinking"
                : ""
            }`}
            style={{
              width: centralSize,
              height: centralSize,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,245,245,0.8))",
              border: `6px solid ${mainColor}`,
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"
                fill={mainColor}
              />
              <path
                d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z"
                fill={mainColor}
              />
            </svg>
          </div>
        </div>

        {/* Conversation Boxes */}
        <div className="w-full max-w-xl px-6">
          <div className="w-full bg-gray-50 rounded-xl p-3 mb-3 min-h-[56px] shadow-sm">
            <div className="text-xs text-gray-500 mb-1 text-right">شما</div>
            <div className="text-base leading-relaxed break-words text-gray-800 font-medium text-right">
              {transcribedText || (
                <span className="text-gray-400">در حال گوش دادن...</span>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-3 min-h-[80px] shadow-sm">
            <div className="text-xs text-gray-500 mb-1 text-right">دستیار</div>
            <div className="text-base leading-relaxed break-words text-gray-800 min-h-[44px] text-right">
              <span>{typedAi}</span>
              {isAiTyping && (
                <span className="inline-block w-1 h-5 align-middle ml-1 bg-gray-800 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        <StateBadge state={currentState} color={mainColor} />
      </div>
    </div>
  );
}

function StateBadge({ state, color }: { state: string; color: string }) {
  const labelMap: Record<string, string> = {
    thinking: "در حال فکر کردن",
    speaking: "در حال صحبت کردن",
    listening: "در حال شنیدن",
    silent: "آماده",
  };

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
      style={{
        background: `${color}22`,
        color: "#333",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
      <span>{labelMap[state]}</span>
    </div>
  );
}
