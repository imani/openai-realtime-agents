"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Cross2Icon,
  SpeakerOffIcon,
  SpeakerLoudIcon,
} from "@radix-ui/react-icons";
import { CircularWaveform, ThemeProvider } from "@pipecat-ai/voice-ui-kit";

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
  const [audioTrack, setAudioTrack] = useState<MediaStreamTrack | null>(null);
  const typeIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Initialize audio stream for CircularWaveform
  useEffect(() => {
    const initializeAudioStream = async () => {
      if (isOpen && isSpeechSupported && !isMuted) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          mediaStreamRef.current = stream;
          const tracks = stream.getAudioTracks();
          if (tracks.length > 0) {
            setAudioTrack(tracks[0]);
          }
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      }
    };

    if (isOpen) {
      initializeAudioStream();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setAudioTrack(null);
      }
    };
  }, [isOpen, isSpeechSupported, isMuted]);

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

  // Set PTT to false and start auto-detect when modal opens
  useEffect(() => {
    if (isOpen && isSpeechSupported && sessionStatus === "CONNECTED") {
      setIsPTTActive(false);
      hasStartedRef.current = true;

      if (!isMuted) {
        onStartListening();
        setVoiceState("listening");
      }
    }

    return () => {
      if (hasStartedRef.current) {
        onStopListening();
        setIsPTTActive(true);
        setVoiceState("silent");
        hasStartedRef.current = false;
      }
    };
  }, [isOpen, isSpeechSupported, sessionStatus]);

  // Handle auto-detect speaking state from parent
  useEffect(() => {
    if (isAutoDetectSpeaking && !isMuted && !isPTTActive) {
      setVoiceState("listening");
    } else if (
      !isAutoDetectSpeaking &&
      currentState === "listening" &&
      !isMuted &&
      !isPTTActive
    ) {
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

  // Handle mute/unmute properly with PTT mode switching
  const toggleMute = () => {
    if (isMuted) {
      // Unmute: Switch back to auto-detect mode
      setIsMuted(false);
      setIsPTTActive(false);
      if (sessionStatus === "CONNECTED") {
        onStartListening();
        setVoiceState("listening");
      }
    } else {
      // Mute: Switch to PTT mode to completely stop listening
      setIsMuted(true);
      setIsPTTActive(true);
      if (isListening) {
        onStopListening();
        setVoiceState("silent");
      }
    }
  };

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

  const handleClose = () => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    if (isListening) {
      onStopListening();
    }
    setIsPTTActive(true);

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
    <ThemeProvider>
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

          {/* CORRECT: CircularWaveform Component */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            <CircularWaveform
              size={280}
              isThinking={currentState === "thinking"}
              audioTrack={!isMuted ? audioTrack : null}
              className="rounded-full"
              color1="#10B981" // Green for listening
              color2="#8B5CF6" // Purple for thinking
              backgroundColor="transparent"
              sensitivity={1.5}
              rotationEnabled={true}
              numBars={64}
              barWidth={3}
              debug={false}
            />

            {/* State Indicator */}
            <div className="absolute -bottom-2">
              <StateBadge
                state={currentState}
                color={mainColor}
                isMuted={isMuted}
                isConnected={isConnected}
              />
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

          {/* Controls */}
          <div className="flex flex-col gap-3 w-full px-6 items-center">
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
      </div>
    </ThemeProvider>
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
