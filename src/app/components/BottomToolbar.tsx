import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  isAutoDetectSpeaking: boolean; // Add this prop
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isMobile: boolean;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  isAutoDetectSpeaking, // Add this prop
  handleTalkButtonDown,
  handleTalkButtonUp,
  isMobile,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  return (
    <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex flex-col md:flex-column items-center justify-evenly gap-4">
        {/* Connection Section */}
        {!isMobile && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected
                    ? "bg-green-500"
                    : isConnecting
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium">
                {isConnected
                  ? "Connected"
                  : isConnecting
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </div>

            <button
              onClick={onToggleConnection}
              disabled={isConnecting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isConnected
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </button>
          </div>
        )}

        {/* Push-to-Talk Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              id="push-to-talk"
              type="checkbox"
              checked={isPTTActive}
              onChange={(e) => setIsPTTActive(e.target.checked)}
              disabled={!isConnected}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="push-to-talk"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Push to Talk
            </label>
          </div>

          {/* Show different UI based on PTT mode */}
          {isPTTActive ? (
            // PTT Mode: Show talk button
            <button
              onMouseDown={handleTalkButtonDown}
              onMouseUp={handleTalkButtonUp}
              onTouchStart={handleTalkButtonDown}
              onTouchEnd={handleTalkButtonUp}
              disabled={!isConnected}
              className={`
                relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-300 
                transition-all duration-200 ease-in-out flex items-center justify-center
                focus:outline-none focus:ring-4 focus:ring-blue-200
                ${
                  isPTTUserSpeaking
                    ? "bg-blue-600 scale-110 border-blue-700 shadow-lg"
                    : "bg-white hover:bg-gray-50 border-gray-300 shadow-md"
                }
                ${
                  !isConnected
                    ? "opacity-50 cursor-not-allowed bg-gray-100"
                    : "cursor-pointer"
                }
              `}
            >
              <div
                className={`
                w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full transition-all
                ${isPTTUserSpeaking ? "scale-125 bg-white" : ""}
              `}
              />

              {/* Pulsing animation when speaking */}
              {isPTTUserSpeaking && (
                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
              )}
            </button>
          ) : (
            // Auto-detect Mode: Show status indicator
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
                relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 
                transition-all duration-200 ease-in-out flex items-center justify-center
                ${
                  isAutoDetectSpeaking
                    ? "bg-green-500 scale-110 border-green-600 shadow-lg text-white"
                    : isConnected
                    ? "bg-green-100 border-green-300 text-green-600"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }
              `}
              >
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                </svg>

                {/* Animated pulse when connected and listening */}
                {isConnected && (
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isAutoDetectSpeaking ? "bg-green-400" : "bg-green-200"
                    } animate-ping opacity-75`}
                  />
                )}

                {/* Voice activity animation bars */}
                {isAutoDetectSpeaking && (
                  <div className="absolute -bottom-1 flex space-x-0.5">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className="w-1 bg-green-600 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 12 + 4}px`,
                          animationDelay: `${bar * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 text-center">
                {isConnected ? (
                  isAutoDetectSpeaking ? (
                    <span className="text-green-600 font-medium animate-pulse">
                      Detecting Speech...
                    </span>
                  ) : (
                    "Listening..."
                  )
                ) : (
                  "Disconnected"
                )}
                <br />
                <span className="text-xs text-gray-400">
                  {isConnected ? "Speak naturally" : "Connect to start"}
                </span>
              </div>
            </div>
          )}

          {/* Speaking status indicator */}
          {isPTTUserSpeaking && isPTTActive && (
            <div className="text-sm text-blue-600 font-medium animate-pulse">
              Speaking...
            </div>
          )}

          {isAutoDetectSpeaking && !isPTTActive && (
            <div className="text-sm text-green-600 font-medium animate-pulse flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-ping" />
              Voice Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BottomToolbar;
