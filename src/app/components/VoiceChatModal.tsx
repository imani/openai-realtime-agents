"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Cross2Icon,
  SpeakerOffIcon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";

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
  transcriptItems?: Array<{
    itemId: string;
    type: "MESSAGE" | "BREADCRUMB";
    role?: "user" | "assistant";
    title?: string;
    timestamp: string;
    isHidden?: boolean;
  }>;
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
  sessionStatus,
  onSendVoiceMessage,
  // onInterrupt,
  // onTalkButtonDown,
  // onTalkButtonUp,
  isPTTActive,
  setIsPTTActive,
  isAutoDetectSpeaking,
  transcriptItems = [],
}: VoiceChatModalProps) {
  const [typedAi, setTypedAi] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const typeIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  const colors = useMemo(
    () => ({
      thinking: "#8B5CF6",
      speaking: "#06b6d4",
      listening: "#10B981",
      silent: "#6B7280",
    }),
    []
  );

  // Filter only assistant messages for display
  const assistantMessages = useMemo(() => {
    return transcriptItems
      .filter(
        (item) =>
          item.type === "MESSAGE" &&
          item.role === "assistant" &&
          !item.isHidden &&
          item.title
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [transcriptItems]);

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

  // CRITICAL FIX: Set PTT to false and start auto-detect when modal opens
  useEffect(() => {
    if (isOpen && isSpeechSupported && sessionStatus === "CONNECTED") {
      // Disable PTT mode to enable auto-detect
      setIsPTTActive(false);
      hasStartedRef.current = true;

      // Start listening in auto-detect mode
      if (!isMuted) {
        onStartListening();
        setVoiceState("listening");
      }
    }

    return () => {
      // Cleanup when modal closes
      if (hasStartedRef.current) {
        onStopListening();
        setVoiceState("silent");
        hasStartedRef.current = false;
      }
    };
  }, [isOpen, isSpeechSupported, sessionStatus]);

  // CRITICAL FIX: Handle auto-detect speaking state from parent
  useEffect(() => {
    if (isAutoDetectSpeaking && !isMuted && !isPTTActive) {
      setVoiceState("listening");
    } else if (
      !isAutoDetectSpeaking &&
      currentState === "listening" &&
      !isMuted &&
      !isPTTActive
    ) {
      // When user stops speaking, process the message
      if (transcribedText) {
        onSendVoiceMessage(transcribedText);
        setVoiceState("thinking");
        setTranscribedText("");
      } else {
        setVoiceState("silent");
      }
    }
  }, [
    isAutoDetectSpeaking,
    isMuted,
    isPTTActive,
    transcribedText,
    currentState,
    onSendVoiceMessage,
    setVoiceState,
    setTranscribedText,
  ]);

  // CRITICAL FIX: Handle mute/unmute properly with PTT mode switching
  const toggleMute = () => {
    if (isMuted) {
      // Unmute: Switch back to auto-detect mode
      setIsMuted(false);
      setIsPTTActive(false); // Disable PTT to enable auto-detect
      if (sessionStatus === "CONNECTED") {
        onStartListening();
        setVoiceState("listening");
      }
    } else {
      // Mute: Switch to PTT mode to completely stop listening
      setIsMuted(true);
      setIsPTTActive(true); // Enable PTT to stop auto-detection
      if (isListening) {
        onStopListening();
        setVoiceState("silent");
      }
    }
  };

  // Ensure PTT mode is properly set when modal state changes
  useEffect(() => {
    if (isOpen && sessionStatus === "CONNECTED") {
      if (isMuted) {
        // When muted, ensure PTT is active to stop listening
        setIsPTTActive(true);
      } else {
        // When unmuted, ensure PTT is inactive to enable auto-detect
        setIsPTTActive(false);
        onStartListening();
        setVoiceState("listening");
      }
    }
  }, [isMuted, isOpen, sessionStatus]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages, typedAi]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }

    if (isOpen) {
      window.addEventListener("keydown", onKey);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      // When modal closes, stop listening and set PTT to active
      if (hasStartedRef.current) {
        onStopListening();
        setIsPTTActive(true); // Set PTT to active when closing modal
        setVoiceState("silent");
        hasStartedRef.current = false;
      }
    };
  }, []);

  const handleClose = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    // Stop listening and set PTT to active when closing
    if (isListening) {
      onStopListening();
    }
    setIsPTTActive(true); // CRITICAL: Set PTT to active when modal closes

    setVoiceState("silent");
    setTranscribedText("");
    setAiResponse("");
    setIsAiTyping(false);
    setTypedAi("");
    setIsMuted(false);
    onClose();
  };

  if (!isOpen) return null;

  const mainColor = colors[currentState];
  const isConnected = sessionStatus === "CONNECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 backdrop-blur-md md:hidden animate-fade-in">
      <button
        onClick={handleClose}
        className="absolute top-5 left-5 p-3 rounded-full bg-white/80 shadow-lg hover:bg-white transition-all hover:scale-110"
      >
        <Cross2Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-5 right-5 p-3 rounded-full bg-white/80 shadow-lg hover:bg-white transition-all hover:scale-110"
        disabled={!isConnected}
      >
        {isMuted ? (
          <SpeakerOffIcon className="w-6 h-6 text-red-500" />
        ) : (
          <SpeakerLoudIcon className="w-6 h-6 text-green-500" />
        )}
      </button>

      <div className="flex flex-col items-center gap-6 w-full max-w-sm h-full py-6">
        {/* Connection Status */}
        {!isConnected && (
          <div className="text-sm text-red-600 font-medium bg-red-50 px-4 py-2 rounded-full shadow-sm">
            {sessionStatus === "CONNECTING"
              ? "🔄 در حال اتصال..."
              : "❌ اتصال برقرار نیست"}
          </div>
        )}

        {/* Mute Status */}
        {isMuted && isConnected && (
          <div className="text-sm text-orange-600 font-medium bg-orange-50 px-4 py-2 rounded-full shadow-sm">
            🔇 حالت سکوت فعال - ربات به صداهای شما گوش نمی‌دهد
          </div>
        )}

        {/* Mode Status */}
        {isConnected && !isMuted && (
          <div className="text-sm text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full shadow-sm">
            🎤 حالت تشخیص خودکار فعال - صحبت کنید
          </div>
        )}

        {/* Magic AI Waveform */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Outer Glow */}
          <div
            className="absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-500"
            style={{ backgroundColor: mainColor }}
          />

          {/* Animated Rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border-2 opacity-40 animate-pulse"
                style={{
                  width: `${120 + ring * 40}px`,
                  height: `${120 + ring * 40}px`,
                  borderColor: mainColor,
                  animationDelay: `${ring * 0.3}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>

          {/* Central Orb */}
          <div className="relative">
            {/* Floating Particles */}
            {[0, 1, 2, 3, 4].map((particle) => (
              <div
                key={particle}
                className="absolute rounded-full animate-float"
                style={{
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  backgroundColor: mainColor,
                  top: `${Math.sin(particle * 0.8) * 60}px`,
                  left: `${Math.cos(particle * 0.8) * 60}px`,
                  opacity: 0.6,
                  animationDelay: `${particle * 0.2}s`,
                  animationDuration: "3s",
                }}
              />
            ))}

            {/* Main Orb */}
            <div
              className={`
                w-32 h-32 rounded-full flex items-center justify-center 
                shadow-2xl transition-all duration-500
                ${
                  currentState === "listening" && !isMuted
                    ? "animate-pulse-slow"
                    : ""
                }
                ${currentState === "thinking" ? "animate-spin-slow" : ""}
                ${currentState === "speaking" ? "animate-glow" : ""}
              `}
              style={{
                background: `radial-gradient(circle at 30% 30%, ${mainColor}40, ${mainColor}20)`,
                border: `2px solid ${mainColor}60`,
                boxShadow: `
                  0 0 40px ${mainColor}40,
                  inset 0 0 20px ${mainColor}20
                `,
                opacity: isMuted ? 0.5 : 1,
              }}
            >
              {/* AI Icon */}
              <div className="text-white text-2xl font-bold">🤖</div>

              {/* Voice Activity Waves */}
              {(currentState === "listening" || currentState === "speaking") &&
                !isMuted && (
                  <div className="absolute inset-0 rounded-full">
                    {[1, 2, 3].map((wave) => (
                      <div
                        key={wave}
                        className="absolute inset-0 rounded-full animate-ripple"
                        style={{
                          border: `2px solid ${mainColor}`,
                          animationDelay: `${wave * 0.3}s`,
                          opacity: 1 - wave * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 w-full max-w-md px-6 flex flex-col gap-4 overflow-hidden">
          {/* Assistant Messages History */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-40">
            {assistantMessages.map((message) => (
              <div
                key={message.itemId}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50"
              >
                <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
                  <span>دستیار</span>
                  <span className="text-xs">{message.timestamp}</span>
                </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                  {message.title}
                </div>
              </div>
            ))}

            {/* Current AI Response */}
            {typedAi && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-blue-100">
                <div className="text-xs text-blue-600 mb-2">
                  دستیار (هم اکنون)
                </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                  {typedAi}
                  {isAiTyping && (
                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse rounded" />
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Input Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
            <div className="text-xs text-gray-500 mb-2">شما</div>
            <div className="text-gray-800 text-sm">
              {transcribedText || (
                <span className="text-gray-400">
                  {!isConnected
                    ? "برای شروع گفتگو اتصال را برقرار کنید"
                    : isMuted
                    ? "❌ ربات به صحبت‌های شما گوش نمی‌دهد"
                    : "✅ در حال گوش دادن... صحبت کنید"}
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
            isMuted={isMuted}
            isConnected={isConnected}
          />

          {/* Status messages */}
          {isMuted && isConnected && (
            <div className="text-sm text-orange-600 font-medium animate-pulse">
              🔊 گوش دادن غیرفعال - برای فعال کردن دکمه را فشار دهید
            </div>
          )}

          {!isSpeechSupported && (
            <div className="text-sm text-red-600 text-center bg-red-50 px-4 py-2 rounded-lg">
              مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند
            </div>
          )}

          <button
            onClick={handleClose}
            className="px-6 py-3 bg-white/80 hover:bg-white text-gray-700 rounded-xl hover:shadow-lg transition-all w-full font-medium border border-white/50"
          >
            پایان گفتگو
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 40px ${mainColor}40, inset 0 0 20px ${mainColor}20;
          }
          50% {
            box-shadow: 0 0 60px ${mainColor}60, inset 0 0 30px ${mainColor}40;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-ripple {
          animation: ripple 2s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-glow {
          animation: glow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function StateBadge({
  state,
  color,
  isMuted = false,
  isConnected = false,
}: {
  state: string;
  color: string;
  isMuted?: boolean;
  isConnected?: boolean;
}) {
  const labels: Record<string, string> = {
    thinking: "🧠 در حال فکر کردن",
    speaking: "🎤 در حال صحبت کردن",
    listening: "👂 در حال گوش دادن",
    silent: isMuted ? "🔇 حالت سکوت" : "✅ آماده",
  };

  const displayState = !isConnected
    ? "❌ قطع ارتباط"
    : isMuted && state === "silent"
    ? labels.silent
    : labels[state];

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{
          background: color,
          boxShadow: `0 0 8px ${color}80`,
          animation: isConnected && !isMuted ? "pulse 1.5s infinite" : "none",
        }}
      />
      <span>{displayState}</span>
    </div>
  );
}
