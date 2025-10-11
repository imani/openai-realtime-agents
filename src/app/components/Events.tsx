"use client";

import React, { useEffect, useRef, useState } from "react";
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
      return { symbol: "▲", color: "#7f5af0", label: "کلاینت" };
    if (direction === "server")
      return { symbol: "▼", color: "#2cb67d", label: "سرور" };
    return { symbol: "•", color: "#555", label: "سیستم" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isExpanded]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (isMobile && e.target === e.currentTarget) {
      // no-op, keep logic same (can add close callback if needed)
    }
  };

  return (
    <>
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
            <div dir="ltr" className="flex-1 overflow-auto">
              {loggedEvents.length === 0 ? (
                <div dir="rtl" className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm">هنوز رویدادی ثبت نشده است</p>
                  <p className="text-xs text-gray-400 mt-1">
                    رویدادها در اینجا نمایش داده می‌شوند
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
                            className="mr-1 ml-2 text-sm flex-shrink-0"
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
                        <div className="text-gray-400 mr-2 text-xs whitespace-nowrap flex-shrink-0">
                          {log.timestamp}
                        </div>
                      </div>

                      {log.expanded && log.eventData && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div dir="rtl" className="text-xs text-gray-500 mb-1">
                            داده‌های رویداد:
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

            <div className="px-4 md:px-6 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
              <div className="flex justify-between items-center">
                <span>تعداد رویدادها: {loggedEvents.length}</span>
                <div className="flex gap-4">
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-500 ml-1"></span>
                    کلاینت:{" "}
                    {
                      loggedEvents.filter((e) => e.direction === "client")
                        .length
                    }
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
                    سرور:{" "}
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
