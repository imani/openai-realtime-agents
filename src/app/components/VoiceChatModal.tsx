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
  setVoiceState,
  transcribedText,
  setTranscribedText,
  aiResponse,
  setAiResponse,
  isAiTyping,
  setIsAiTyping,
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

  // Typing effect
  useEffect(() => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }

    if (isAiTyping) {
      setTypedAi("");
      let i = 0;
      const len = aiResponse?.length ?? 0;
      const speed = 25;

      typeIntervalRef.current = window.setInterval(() => {
        i++;
        setTypedAi(aiResponse.slice(0, i));
        if (i >= len) {
          clearInterval(typeIntervalRef.current!);
          typeIntervalRef.current = null;
          setIsAiTyping(false);
          setVoiceState("silent");
        }
      }, speed);
    } else {
      setTypedAi(aiResponse ?? "");
    }

    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
    };
  }, [aiResponse, isAiTyping]);

  // Auto flow simulation: listen → think → speak
  useEffect(() => {
    if (!isOpen) return;

    setVoiceState("listening");

    const steps = [
      () => {
        setTranscribedText("سلام! حالت چطوره؟");
        setVoiceState("thinking");
      },
      () => {
        setAiResponse("من خوبم، ممنون! چطور می‌تونم کمکت کنم؟");
        setIsAiTyping(true);
        setVoiceState("speaking");
      },
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) steps[i++]();
      else clearInterval(timer);
    }, 3000);

    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleClose = () => {
    setVoiceState("silent");
    setTranscribedText("");
    setAiResponse("");
    setIsAiTyping(false);
    onClose();
  };

  if (!isOpen) return null;

  const mainColor = colors[currentState];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md md:hidden animate-fade-in">
      <button
        onClick={handleClose}
        className="absolute top-5 left-5 p-2 rounded-full bg-gray-100 shadow hover:bg-gray-200 transition"
      >
        <Cross2Icon className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex flex-col items-center gap-6">
        {/* Animated microphone */}
        <div className="relative w-[280px] h-[280px] flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full ${
              currentState === "speaking"
                ? "animate-wave-speaking"
                : currentState === "listening"
                ? "animate-wave-listening"
                : currentState === "thinking"
                ? "animate-wave-thinking"
                : ""
            }`}
            style={{
              border: `2px solid ${mainColor}33`,
              boxShadow: `0 0 30px ${mainColor}22`,
            }}
          />
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-xl"
            style={{
              background: "linear-gradient(180deg, #fff, #f3f3f3)",
              border: `6px solid ${mainColor}`,
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
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

        {/* Conversation */}
        <div className="w-full max-w-md px-6 text-right">
          <div className="bg-gray-50 rounded-xl p-3 mb-3 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">شما</div>
            <div className="text-gray-800 text-base">
              {transcribedText || "در حال گوش دادن..."}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 shadow-sm min-h-[80px]">
            <div className="text-xs text-gray-500 mb-1">دستیار</div>
            <div className="text-gray-800 text-base">
              {typedAi}
              {isAiTyping && (
                <span className="inline-block w-1 h-5 bg-gray-800 ml-1 animate-pulse" />
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
  const labels: Record<string, string> = {
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
      <span>{labels[state]}</span>
    </div>
  );
}
