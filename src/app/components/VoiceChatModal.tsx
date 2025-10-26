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
  onStartListening: () => void;
  onStopListening: () => void;
  isListening: boolean;
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
  onStartListening,
  onStopListening,
  isListening,
}: VoiceChatModalProps) {
  const [typedAi, setTypedAi] = useState("");
  const typeIntervalRef = useRef<number | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  const colors = useMemo(
    () => ({
      thinking: "#6b7280",
      speaking: "#06b6d4",
      listening: "#f59e0b",
      silent: "#9ca3af",
    }),
    []
  );

  // Typing effect for AI response
  useEffect(() => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }

    if (isAiTyping && aiResponse) {
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
          setShowRetry(true);
        }
      }, speed);
    } else {
      setTypedAi(aiResponse || "");
    }

    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
    };
  }, [aiResponse, isAiTyping, setIsAiTyping, setVoiceState]);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      onStartListening();
      setShowRetry(false);
    }
  }, [isOpen]);

  // Handle when user finishes speaking
  useEffect(() => {
    if (transcribedText && !isListening && currentState === "listening") {
      setVoiceState("thinking");
    }
  }, [transcribedText, isListening, currentState, setVoiceState]);

  // Retry listening after AI finishes speaking
  const handleRetry = () => {
    setTranscribedText("");
    setAiResponse("");
    setTypedAi("");
    setShowRetry(false);
    onStartListening();
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleClose = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }
    onStopListening();
    setVoiceState("silent");
    setTranscribedText("");
    setAiResponse("");
    setIsAiTyping(false);
    setTypedAi("");
    setShowRetry(false);
    onClose();
  };

  const handleMicrophoneClick = () => {
    if (currentState === "listening") {
      onStopListening();
    } else if (currentState === "silent" && showRetry) {
      handleRetry();
    } else if (currentState === "silent") {
      onStartListening();
    }
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

      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Animated microphone with click handler */}
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
          <button
            onClick={handleMicrophoneClick}
            disabled={currentState === "thinking" || isAiTyping}
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
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

            {/* Listening animation */}
            {currentState === "listening" && (
              <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Conversation */}
        <div className="w-full max-w-md px-6 text-right">
          <div className="bg-gray-50 rounded-xl p-3 mb-3 shadow-sm min-h-[60px]">
            <div className="text-xs text-gray-500 mb-1">شما</div>
            <div className="text-gray-800 text-base">
              {transcribedText || (
                <span className="text-gray-400">
                  {currentState === "listening"
                    ? "در حال گوش دادن..."
                    : "برای شروع صحبت کنید"}
                </span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 shadow-sm min-h-[80px]">
            <div className="text-xs text-gray-500 mb-1">دستیار</div>
            <div className="text-gray-800 text-base">
              {typedAi}
              {isAiTyping && (
                <span className="inline-block w-1 h-5 bg-gray-800 ml-1 animate-pulse" />
              )}
              {!typedAi && !isAiTyping && (
                <span className="text-gray-400">
                  پاسخ اینجا نمایش داده می‌شود...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 w-full px-6">
          <StateBadge state={currentState} color={mainColor} />

          {showRetry && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              صحبت مجدد
            </button>
          )}

          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            پایان گفتگو
          </button>
        </div>
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
