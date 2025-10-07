import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
}

function BottomToolbar({
  sessionStatus,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";

  return (
    <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex flex-col md:flex-column items-center justify-evenly gap-4">
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

          <button
            onMouseDown={handleTalkButtonDown}
            onMouseUp={handleTalkButtonUp}
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            disabled={!isPTTActive || !isConnected}
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
                !isPTTActive || !isConnected
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

          {isPTTUserSpeaking && (
            <div className="text-sm text-blue-600 font-medium animate-pulse">
              Speaking...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BottomToolbar;
