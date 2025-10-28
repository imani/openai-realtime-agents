"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { CircularWaveform, ThemeProvider } from "@pipecat-ai/voice-ui-kit";
import { TranscriptItem } from "../types";
import MicrophoneIcon from "./Icons/MicrophoneIcon";
import MicrophoneOffIcon from "./Icons/MicrophoneOffIcon";

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
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isAutoDetectSpeaking: boolean;
  transcriptItems?: TranscriptItem[];
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
          if (tracks.length > 0) setAudioTrack(tracks[0]);
        } catch (error) {
          console.error("Error accessing microphone:", error);
        }
      }
    };

    if (isOpen) initializeAudioStream();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setAudioTrack(null);
      }
    };
  }, [isOpen, isSpeechSupported, isMuted]);

  useEffect(() => {
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
      typeIntervalRef.current = null;
    }

    if (isAiTyping && aiResponse) {
      setTypedAi("");
      let i = 0;
      const speed = 25;

      typeIntervalRef.current = window.setInterval(() => {
        i++;
        setTypedAi(aiResponse.slice(0, i));
        if (i >= aiResponse.length) {
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

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setIsPTTActive(false);
      if (sessionStatus === "CONNECTED") {
        onStartListening();
        setVoiceState("listening");
      }
    } else {
      setIsMuted(true);
      setIsPTTActive(true);
      if (isListening) {
        onStopListening();
        setVoiceState("silent");
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages, typedAi]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleClose = () => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    if (isListening) onStopListening();
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

  const isConnected = sessionStatus === "CONNECTED";

  return (
    <ThemeProvider>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white backdrop-blur-sm">
        <div className="absolute top-6 left-6">
          <button
            onClick={handleClose}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Cross2Icon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="absolute top-6 right-6">
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30"
          >
            {isMuted ? (
              <MicrophoneOffIcon className="w-5 h-5 text-red-500 fill-red-500" />
            ) : (
              <MicrophoneIcon className="w-5 h-5 text-green-500 fill-green-500" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center w-full max-w-sm px-6 space-y-8">
          {!isConnected && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-full">
              {sessionStatus === "CONNECTING"
                ? "🔄 در حال اتصال..."
                : "❌ اتصال برقرار نیست"}
            </div>
          )}

          <div className="relative">
            <CircularWaveform
              size={280}
              isThinking={currentState === "thinking"}
              audioTrack={!isMuted ? audioTrack : null}
              className="rounded-full"
              color1="#10B981"
              color2="#8B5CF6"
              backgroundColor="transparent"
              sensitivity={1.5}
              rotationEnabled={true}
              numBars={128}
              barWidth={3}
              debug={false}
            />
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {assistantMessages.map((message) => (
                <div
                  key={message.itemId}
                  className="bg-gray-50 rounded-2xl p-4"
                >
                  <div className="text-xs text-gray-500 mb-2 flex justify-between">
                    <span>دستیار</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {message.title}
                  </div>
                </div>
              ))}

              {typedAi && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="text-xs text-blue-600 mb-2">
                    دستیار (هم اکنون)
                  </div>
                  <div className="text-gray-800 text-sm leading-relaxed">
                    {typedAi}
                    {isAiTyping && (
                      <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-pulse rounded" />
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="text-gray-800 text-sm">
                {transcribedText || (
                  <span className="text-gray-400">
                    {!isConnected
                      ? "برای شروع گفتگو اتصال را برقرار کنید"
                      : isMuted
                      ? "❌ ربات صحبت‌های شما را نمی‌شنود"
                      : "✅ در حال شنیدن... صحبت کنید"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isSpeechSupported && (
            <div className="text-sm text-red-600 text-center bg-red-50 px-4 py-3 rounded-xl w-full">
              مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
