"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/app/contexts/EventContext";
import { LoggedEvent } from "@/app/types";

export interface EventsProps {
  isExpanded: boolean;
  isMobile?: boolean;
}

function Events({ isExpanded, isMobile = false }: EventsProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<LoggedEvent[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents, toggleExpand } = useEvent();

  const getDirectionArrow = (direction: string) => {
    if (direction === "client")
      return { symbol: "▲", color: "#7f5af0", label: "Client" };
    if (direction === "server")
      return { symbol: "▼", color: "#2cb67d", label: "Server" };
    return { symbol: "•", color: "#555", label: "System" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isExpanded]);

  // Close events pane on mobile when clicking outside (if implemented)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMobile && e.target === e.currentTarget) {
      // You might want to add a callback to close the events pane
      // This would require adding a prop to control this behavior
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleBackdropClick}
        />
      )}

      <div
        className={`
          ${
            isExpanded
              ? isMobile
                ? "fixed inset-4 z-50 bg-white rounded-xl shadow-xl"
                : "w-full md:w-1/2 lg:w-1/3 overflow-auto"
              : "w-0 overflow-hidden opacity-0"
          }
          transition-all duration-200 ease-in-out flex-col bg-white
          ${isMobile ? "md:relative md:inset-auto" : "relative"}
        `}
        ref={eventLogsContainerRef}
      >
        {isExpanded && (
          <div className="h-full flex flex-col">
            {/* Logs content */}
            <div className="flex-1 overflow-auto">
              {loggedEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm">No events logged yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Events will appear here as they occur
                  </p>
                </div>
              ) : (
                loggedEvents.map((log, idx) => {
                  const arrowInfo = getDirectionArrow(log.direction);
                  const isError =
                    log.eventName.toLowerCase().includes("error") ||
                    log.eventData?.response?.status_details?.error != null;

                  return (
                    <div
                      key={`${log.id}-${idx}`}
                      className="border-t border-gray-100 py-3 px-4 md:px-6 font-mono hover:bg-gray-50 transition-colors"
                    >
                      <div
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <span
                            style={{ color: arrowInfo.color }}
                            className="ml-1 mr-2 text-sm flex-shrink-0"
                            title={arrowInfo.label}
                          >
                            {arrowInfo.symbol}
                          </span>
                          <span
                            className={
                              `flex-1 text-sm truncate ${
                                isMobile ? "max-w-[120px]" : ""
                              } ` +
                              (isError
                                ? "text-red-600 font-medium"
                                : "text-gray-700")
                            }
                            title={log.eventName}
                          >
                            {log.eventName}
                          </span>
                        </div>
                        <div className="text-gray-400 ml-2 text-xs whitespace-nowrap flex-shrink-0">
                          {log.timestamp}
                        </div>
                      </div>

                      {log.expanded && log.eventData && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">
                            Event Data:
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-xs overflow-auto max-h-60">
                            {JSON.stringify(log.eventData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer stats */}
            <div className="px-4 md:px-6 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <div className="flex justify-between items-center">
                <span>Total events: {loggedEvents.length}</span>
                <div className="flex gap-4">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
                    Client:{" "}
                    {
                      loggedEvents.filter((e) => e.direction === "client")
                        .length
                    }
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Server:{" "}
                    {
                      loggedEvents.filter((e) => e.direction === "server")
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Events;
