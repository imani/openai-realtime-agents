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
  isSpeechSupported: boolean;
  sessionStatus: "CONNECTED" | "CONNECTING" | "DISCONNECTED";
  onSendVoiceMessage: (message: string) => void;
  onInterrupt: () => void;
  onTalkButtonDown: () => void;
  onTalkButtonUp: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isAutoDetectSpeaking: boolean;
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
  isSpeechSupported,
  // New props
  sessionStatus,
  onSendVoiceMessage,
  onInterrupt,
  onTalkButtonDown,
  onTalkButtonUp,
  isPTTActive,
  setIsPTTActive,
  isAutoDetectSpeaking,
}: VoiceChatModalProps) {
  const [typedAi, setTypedAi] = useState("");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
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

  // Typing effect for AI response
  useEffect(() => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }

    if (isAiTyping && aiResponse) {
      setTypedAi("");
      let i = 0;
      const len = aiResponse.length;
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
      setTypedAi(aiResponse || "");
    }

    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
      }
    };
  }, [aiResponse, isAiTyping, setIsAiTyping, setVoiceState]);

  // Handle voice activity from the real API
  useEffect(() => {
    if (isAutoDetectSpeaking && !isPTTActive) {
      setVoiceState("listening");
    }
  }, [isAutoDetectSpeaking, isPTTActive, setVoiceState]);

  // Handle when speech is transcribed and ready to send
  useEffect(() => {
    if (transcribedText && !isListening && sessionStatus === "CONNECTED") {
      // Send the transcribed text to the AI
      onSendVoiceMessage(transcribedText);
      setVoiceState("thinking");
    }
  }, [
    transcribedText,
    isListening,
    sessionStatus,
    onSendVoiceMessage,
    setVoiceState,
  ]);

  const handleTalkButtonDown = () => {
    if (sessionStatus !== "CONNECTED") return;

    onInterrupt();
    setIsUserSpeaking(true);
    setVoiceState("listening");
    onTalkButtonDown();
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== "CONNECTED" || !isUserSpeaking) return;

    setIsUserSpeaking(false);
    onTalkButtonUp();
  };

  const handleMicrophoneClick = () => {
    if (isPTTActive) {
      if (!isUserSpeaking) {
        handleTalkButtonDown();
      } else {
        handleTalkButtonUp();
      }
    }
  };

  const togglePTTMode = () => {
    setIsPTTActive(!isPTTActive);
    if (isUserSpeaking) {
      handleTalkButtonUp();
    }
  };

  // Auto-start listening when modal opens in auto-detect mode
  useEffect(() => {
    if (
      isOpen &&
      !isPTTActive &&
      isSpeechSupported &&
      sessionStatus === "CONNECTED"
    ) {
      onStartListening();
    }
  }, [isOpen, isPTTActive, isSpeechSupported, sessionStatus]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      // Space bar for push-to-talk
      if (
        e.key === " " &&
        isPTTActive &&
        isSpeechSupported &&
        sessionStatus === "CONNECTED"
      ) {
        if (e.type === "keydown" && !isUserSpeaking) {
          handleTalkButtonDown();
        } else if (e.type === "keyup" && isUserSpeaking) {
          handleTalkButtonUp();
        }
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [isOpen, isPTTActive, isUserSpeaking, isSpeechSupported, sessionStatus]);

  const handleClose = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    if (isUserSpeaking) {
      handleTalkButtonUp();
    }
    if (isListening) {
      onStopListening();
    }

    setVoiceState("silent");
    setTranscribedText("");
    setAiResponse("");
    setIsAiTyping(false);
    setTypedAi("");
    setIsUserSpeaking(false);
    onClose();
  };

  if (!isOpen) return null;

  const mainColor = colors[currentState];
  const isConnected = sessionStatus === "CONNECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-md md:hidden animate-fade-in">
      <button
        onClick={handleClose}
        className="absolute top-5 left-5 p-2 rounded-full bg-gray-100 shadow hover:bg-gray-200 transition"
      >
        <Cross2Icon className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <input
            id="push-to-talk-modal"
            type="checkbox"
            checked={isPTTActive}
            onChange={togglePTTMode}
            disabled={!isSpeechSupported || !isConnected}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="push-to-talk-modal"
            className="text-sm font-medium cursor-pointer select-none"
          >
            صحبت با فشردن دکمه
          </label>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full">
            {sessionStatus === "CONNECTING"
              ? "در حال اتصال..."
              : "اتصال برقرار نیست"}
          </div>
        )}

        {/* Animated microphone */}
        <div className="relative w-[280px] h-[280px] flex items-center justify-center">
          {/* Background waves */}
          <div
            className={`absolute inset-0 rounded-full ${
              currentState === "speaking" ||
              isUserSpeaking ||
              isAutoDetectSpeaking
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

          {/* Microphone Button */}
          <button
            onClick={isPTTActive ? handleMicrophoneClick : undefined}
            disabled={
              !isSpeechSupported ||
              !isConnected ||
              (!isPTTActive && isAutoDetectSpeaking)
            }
            className={`
              relative w-[120px] h-[120px] rounded-full flex items-center justify-center shadow-xl 
              transition-all duration-200 ease-in-out
              ${
                isPTTActive
                  ? `cursor-pointer hover:scale-105 active:scale-95 ${
                      isUserSpeaking
                        ? "bg-blue-600 scale-110 border-blue-700"
                        : "bg-white border-gray-300"
                    }`
                  : `${
                      isAutoDetectSpeaking
                        ? "bg-green-500 scale-110 border-green-600 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`
              }
              ${
                !isSpeechSupported || !isConnected
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            style={{
              border: `6px solid ${mainColor}`,
              background:
                isPTTActive && !isUserSpeaking
                  ? "linear-gradient(180deg, #fff, #f3f3f3)"
                  : undefined,
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
              <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z" />
            </svg>

            {/* Speaking indicators */}
            {isUserSpeaking && (
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
            )}

            {isAutoDetectSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                <div className="absolute -bottom-2 flex space-x-1">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className="w-1 bg-white rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 12 + 4}px`,
                        animationDelay: `${bar * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </>
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
                  {!isConnected
                    ? "برای شروع گفتگو اتصال را برقرار کنید"
                    : isPTTActive
                    ? "دکمه را فشار دهید و صحبت کنید"
                    : "به طور طبیعی صحبت کنید"}
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
                  {!isConnected
                    ? "در انتظار اتصال..."
                    : "پاسخ اینجا نمایش داده می‌شود..."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="flex flex-col gap-3 w-full px-6 items-center">
          <StateBadge
            state={currentState}
            color={mainColor}
            isUserSpeaking={isUserSpeaking}
            isAutoDetectSpeaking={isAutoDetectSpeaking}
            isConnected={isConnected}
          />

          {/* Status messages */}
          {isUserSpeaking && isPTTActive && (
            <div className="text-sm text-blue-600 font-medium animate-pulse">
              در حال صحبت کردن...
            </div>
          )}

          {isAutoDetectSpeaking && !isPTTActive && (
            <div className="text-sm text-green-600 font-medium animate-pulse flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-ping" />
              صدا تشخیص داده شد
            </div>
          )}

          {!isSpeechSupported && (
            <div className="text-sm text-red-600 text-center">
              مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند
            </div>
          )}

          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
          >
            پایان گفتگو
          </button>

          {isPTTActive && isConnected && (
            <div className="text-xs text-gray-500 text-center">
              برای صحبت کردن دکمه میکروفون را فشار دهید
              <br />
              یا از کلید Space استفاده کنید
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StateBadge({
  state,
  color,
  isUserSpeaking = false,
  isAutoDetectSpeaking = false,
  isConnected = false,
}: {
  state: string;
  color: string;
  isUserSpeaking?: boolean;
  isAutoDetectSpeaking?: boolean;
  isConnected?: boolean;
}) {
  const labels: Record<string, string> = {
    thinking: "در حال فکر کردن",
    speaking: "در حال صحبت کردن",
    listening:
      isUserSpeaking || isAutoDetectSpeaking
        ? "در حال شنیدن صحبت شما"
        : "در حال شنیدن",
    silent: isConnected ? "آماده" : "اتصال برقرار نیست",
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
