"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { SessionStatus, TranscriptItem } from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { GuardrailChip } from "./GuardrailChip";
import VoiceChatModal from "./VoiceChatModal";

export interface MobileTranscriptProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
}

function MobileTranscript({
  sessionStatus,
  onToggleConnection,
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm">
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
        <h2 className="text-lg font-semibold text-gray-800">گفتگو</h2>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? "bg-green-500"
                  : isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium hidden sm:inline">
              {isConnected
                ? "اتصال برقرار شد"
                : isConnecting
                ? "در حال اتصال..."
                : "اتصال برقرار نیست"}
            </span>
          </div>

          <button
            onClick={onToggleConnection}
            disabled={isConnecting}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isConnected
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnected ? "قطع اتصال" : "اتصال"}
          </button>
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

      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!canSend}
          />
          <button
            onClick={onSendMessage}
            disabled={!userText.trim() || !canSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ارسال
          </button>
        </div>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="... md:hidden"
        >
          شروع گفت‌وگو صوتی
        </button>

        {canSend && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={downloadRecording}
              className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center"
            >
              <svg
                className="w-4 h-4 ml-1"
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
        )}
        <VoiceChatModal
          isOpen={isVoiceModalOpen}
          onClose={() => setVoiceModalOpen(false)}
          currentState={voiceState}
          setVoiceState={setVoiceState}
          transcribedText={transcribedText}
          setTranscribedText={setTranscribedText}
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
          isAiTyping={isAiTyping}
          setIsAiTyping={setIsAiTyping}
        />
      </div>
    </div>
  );
}

export default MobileTranscript;
