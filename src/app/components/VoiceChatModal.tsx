// components/VoiceChatModal.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

export interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: "thinking" | "speaking" | "listening" | "silent";
  transcribedText: string;
  aiResponse: string;
  isAiTyping: boolean;
}

export default function VoiceChatModal({
  isOpen,
  onClose,
  currentState,
  transcribedText,
  aiResponse,
  isAiTyping,
}: VoiceModalProps) {
  const [typedAi, setTypedAi] = useState<string>("");
  const typeIntervalRef = useRef<number | null>(null);

  // Color map (hex) for each state
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
      className="fixed inset-0 z-50 md:hidden"
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-50 h-full w-full flex items-center justify-center p-4">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <button
            onClick={onClose}
            aria-label="Close voice modal"
            className="absolute top-5 left-5 p-2 rounded-full bg-white bg-opacity-90 shadow-md hover:bg-opacity-100 focus:outline-none"
          >
            <Cross2Icon className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {/* waveform */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: rings[rings.length - 1].size,
                height: rings[rings.length - 1].size,
              }}
            >
              {/* animated rings */}
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

              {/* central circle */}
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
                    "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.06))",
                  border: `6px solid ${mainColor}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium select-none"
                  style={{
                    color: "#ffffff",
                    textShadow: `0 2px 10px ${mainColor}66`,
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
            </div>

            {/* text areas */}
            <div className="w-full max-w-xl px-6">
              <div className="w-full bg-white bg-opacity-6 backdrop-blur-sm rounded-xl p-3 mb-3 min-h-[56px] flex items-center">
                <div className="flex-1 text-right">
                  <div className="text-xs text-gray-300 mb-1">شما</div>
                  <div className="text-base leading-relaxed break-words font-medium text-white">
                    {transcribedText || (
                      <span className="text-gray-400">در حال گوش دادن...</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full bg-white bg-opacity-6 backdrop-blur-sm rounded-xl p-3 min-h-[80px]">
                <div className="text-xs text-gray-300 mb-1">دستیار</div>
                <div
                  className="text-base leading-relaxed break-words text-white"
                  style={{ minHeight: 44 }}
                >
                  <span>{typedAi}</span>
                  {isAiTyping && (
                    <span className="inline-block w-1 h-5 align-middle ml-1 bg-white animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-200 text-center">
              <StateBadge state={currentState} color={mainColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StateBadge({ state, color }: { state: string; color: string }) {
  let label = "";
  switch (state) {
    case "thinking":
      label = "در حال فکر کردن";
      break;
    case "speaking":
      label = "در حال صحبت کردن";
      break;
    case "listening":
      label = "در حال شنیدن";
      break;
    default:
      label = "آماده";
      break;
  }
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: `${color}22`,
        color: "#fff",
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
      />
      <span>{label}</span>
    </div>
  );
}
