"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SessionStatus, TranscriptItem } from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { GuardrailChip } from "./GuardrailChip";
import VoiceChatModal from "./VoiceChatModal";
import VoiceChatIcon from "./Icons/VoiceChatIcon";

export interface MobileTranscriptProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
  onSendVoiceMessage: (message: string) => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isAutoDetectSpeaking: boolean;
}

function MobileTranscript({
  sessionStatus,
  onToggleConnection,
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
  onSendVoiceMessage,
  isAutoDetectSpeaking,
  isPTTActive,
  setIsPTTActive,
}: MobileTranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<
    "thinking" | "speaking" | "listening" | "silent"
  >("silent");
  const [transcribedText, setTranscribedText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }
    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      setIsSpeechSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "fa-IR";

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setVoiceState("listening");
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript =
          event.results[event.results.length - 1][0].transcript;
        setTranscribedText(transcript);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        if (transcribedText) {
          handleVoiceMessage(transcribedText);
        } else {
          setVoiceState("silent");
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setVoiceState("silent");
        if (event.error === "not-allowed") {
          alert("دسترسی به میکروفون مجاز نیست. لطفاً مجوزها را بررسی کنید.");
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech recognition not supported in this browser");
      setIsSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (
      !isAutoDetectSpeaking &&
      transcribedText &&
      voiceState === "listening"
    ) {
      setVoiceState("thinking");
    }
  }, [isAutoDetectSpeaking, transcribedText, voiceState]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleVoiceMessage = async (message: string) => {
    if (!message.trim()) return;
    setVoiceState("thinking");
    try {
      onSendVoiceMessage(message);
    } catch (error) {
      console.error("API call error:", error);
      setVoiceState("silent");
    }
  };

  const startVoiceRecognition = () => {
    if (recognition && !isListening && isSpeechSupported) {
      setTranscribedText("");
      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setVoiceState("silent");
      }
    } else if (!isSpeechSupported) {
      alert(
        "مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید."
      );
    }
  };

  const stopVoiceRecognition = () => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }
  };

  const handleVoiceModalOpen = () => {
    if (!isSpeechSupported) {
      alert(
        "مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید."
      );
      return;
    }
    setVoiceModalOpen(true);
  };

  const handleVoiceModalClose = () => {
    stopVoiceRecognition();
    setVoiceModalOpen(false);
    setVoiceState("silent");
    setTranscribedText("");
    setAiResponse("");
    setIsAiTyping(false);
    setIsListening(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">گفتگو</h2>
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <button
              onClick={onToggleConnection}
              disabled={isConnecting}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isConnected
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isConnected ? "قطع اتصال" : "اتصال"}
            </button>
          </div>
        </div>
      </div>

      <div
        ref={transcriptRef}
        className="flex-1 overflow-auto p-4 flex flex-col gap-y-4"
      >
        {[...transcriptItems]
          .sort((a, b) => a.createdAtMs - b.createdAtMs)
          .map((item) => {
            const {
              itemId,
              type,
              role,
              data,
              expanded,
              timestamp,
              title = "",
              isHidden,
              guardrailResult,
            } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-full p-3 ${
                isUser
                  ? "bg-blue-600 text-white rounded-l-xl rounded-tr-xl"
                  : "bg-gray-100 text-black rounded-r-xl rounded-tl-xl"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? "italic text-gray-400"
                : "";
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className="w-full max-w-full">
                    <div
                      className={`${bubbleBase} ${
                        guardrailResult ? "" : "rounded-b-xl"
                      }`}
                    >
                      <div
                        className={`text-xs ${
                          isUser ? "text-blue-200" : "text-gray-500"
                        } font-mono mb-1`}
                      >
                        {timestamp}
                      </div>
                      <div
                        className={`whitespace-pre-wrap ${messageStyle} ${
                          isUser ? "text-white" : "text-black"
                        }`}
                      >
                        <ReactMarkdown>{displayTitle}</ReactMarkdown>
                      </div>
                    </div>
                    {guardrailResult && (
                      <div className="bg-gray-100 px-3 py-2 rounded-b-xl border border-gray-200">
                        <GuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-gray-500 text-sm bg-gray-50 p-3 rounded-lg"
                >
                  <span className="text-xs font-mono text-gray-400 mb-1">
                    {timestamp}
                  </span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-medium text-gray-700 ${
                      data ? "cursor-pointer hover:text-gray-900" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-gray-400 mr-2 transform transition-transform duration-200 select-none ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>
                  {expanded && data && (
                    <div className="w-full mt-2 p-3 bg-white rounded border border-gray-200">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div
                  key={itemId}
                  className="flex justify-center text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-xs mr-2">•</span>
                  نوع آیتم نامشخص: {type}
                  <span className="mr-2 text-xs text-gray-400">
                    {timestamp}
                  </span>
                </div>
              );
            }
          })}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-gray-100">
        <div className="flex gap-1 items-center">
          <button
            onClick={handleVoiceModalOpen}
            disabled={!canSend || !isSpeechSupported}
            className="px-2 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <VoiceChatIcon />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right bg-gray-50"
            disabled={!canSend}
            dir="rtl"
          />
          <button
            onClick={onSendMessage}
            disabled={!userText.trim() || !canSend}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors "
          >
            ارسال
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={downloadRecording}
            className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center justify-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            دریافت فایل صوتی
          </button>
        </div>
      </div>

      <VoiceChatModal
        isOpen={isVoiceModalOpen}
        onClose={handleVoiceModalClose}
        currentState={voiceState}
        setVoiceState={setVoiceState}
        transcribedText={transcribedText}
        setTranscribedText={setTranscribedText}
        aiResponse={aiResponse}
        setAiResponse={setAiResponse}
        isAiTyping={isAiTyping}
        setIsAiTyping={setIsAiTyping}
        onStartListening={startVoiceRecognition}
        onStopListening={stopVoiceRecognition}
        isListening={isListening}
        isSpeechSupported={isSpeechSupported}
        sessionStatus={sessionStatus}
        onSendVoiceMessage={onSendVoiceMessage}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isAutoDetectSpeaking={isAutoDetectSpeaking}
        transcriptItems={transcriptItems}
      />
    </div>
  );
}

export default MobileTranscript;
