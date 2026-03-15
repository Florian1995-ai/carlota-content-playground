"use client";

import { useState } from "react";
import { useApp, type ContentPiece } from "@/lib/store";
import { format, startOfWeek, addDays } from "date-fns";
import { Copy, Trash2, Check, X } from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function ContentCard({ piece, onClick }: { piece: ContentPiece; onClick: () => void }) {
  const typeLabel = piece.type === "talking_head" ? "TALKING HEAD" : "CAROUSEL";
  const typeColor = piece.type === "talking_head" ? "#22c55e" : "#f59e0b";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2 rounded text-xs cursor-pointer mb-1"
      style={{ backgroundColor: typeColor + "22", borderLeft: `3px solid ${typeColor}` }}
    >
      <span className="text-[9px] font-bold uppercase" style={{ color: typeColor }}>{typeLabel}</span>
      <p className="truncate mt-0.5" style={{ color: "var(--foreground)" }}>{piece.title}</p>
    </button>
  );
}

function CardDetailModal({ piece, onClose }: { piece: ContentPiece; onClose: () => void }) {
  const { dispatch } = useApp();

  const handleCopy = () => {
    navigator.clipboard.writeText(piece.content);
  };

  const handleMarkPublished = () => {
    // For now just close
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Content</h3>
            <p className="text-xs text-gray-500">{piece.scheduledDate ? format(new Date(piece.scheduledDate), "EEEE d MMMM").toUpperCase() : "Unscheduled"}</p>
          </div>
          <button onClick={onClose} className="p-1 cursor-pointer"><X size={16} className="text-gray-400" /></button>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap mb-6">{piece.content}</div>

        <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--card-border)" }}>
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 cursor-pointer">
            <Trash2 size={14} /> Delete
          </button>
          <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
            ✏️ Edit
          </button>
          <button className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "var(--accent)" }}>
            ⏰ Unschedule
          </button>
          <button
            onClick={handleMarkPublished}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white ml-auto cursor-pointer"
            style={{ backgroundColor: "var(--badge-high)" }}>
            <Check size={12} /> Mark Published
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{ backgroundColor: "var(--card-border)" }}>
            <Copy size={12} /> Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanView() {
  const { state, dispatch } = useApp();
  const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group scheduled content by date
  const scheduledByDate: Record<string, ContentPiece[]> = {};
  state.contentQueue.forEach((piece) => {
    if (piece.scheduledDate) {
      const key = piece.scheduledDate;
      if (!scheduledByDate[key]) scheduledByDate[key] = [];
      scheduledByDate[key].push(piece);
    }
  });

  const unscheduled = state.contentQueue.filter((p) => !p.scheduledDate);

  const handleDrop = (pieceId: string, dateStr: string) => {
    dispatch({ type: "SCHEDULE_CONTENT", payload: { id: pieceId, date: dateStr } });
  };

  return (
    <div className="flex h-full">
      {/* Ready Queue - Left Sidebar */}
      <div className="w-64 border-r overflow-y-auto p-4" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--sidebar-bg)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-1">
            <span style={{ color: "var(--badge-high)" }}>●</span> Ready Queue
          </h2>
          <span className="text-xs text-gray-500">{unscheduled.length}</span>
        </div>

        {unscheduled.length === 0 && state.contentQueue.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-8">
            Approved content will appear here. Generate and approve content first.
          </p>
        )}

        <div className="space-y-2">
          {unscheduled.map((piece) => (
            <div
              key={piece.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("pieceId", piece.id)}
              className="p-3 rounded-lg cursor-grab"
              style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                {piece.type === "talking_head" ? "TALKING HEAD REEL" : "POST"}
              </span>
              <p className="text-sm font-medium mt-1 truncate">{piece.title}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                Ready • {format(new Date(piece.createdAt), "d MMM")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold" style={{ color: "var(--accent)" }}>Content Planner</h1>
            <button className="text-xs px-2 py-1 rounded border cursor-pointer" style={{ borderColor: "var(--card-border)" }}>
              ↻ Sync Notion
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Calendar</span>
              <span className="text-gray-600">Published</span>
              <span className="text-gray-600">Analytics</span>
              <span className="text-gray-600">Trash</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button className="px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "var(--card-bg)" }}>Month</button>
              <button className="px-2 py-1 rounded cursor-pointer" style={{ backgroundColor: "var(--accent)", color: "white" }}>Week</button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <button className="text-gray-400 hover:text-white cursor-pointer">‹</button>
            <h2 className="font-semibold">
              📅 {format(weekStart, "MMMM d")} – {format(addDays(weekStart, 6), "MMMM d, yyyy")}
            </h2>
            <button className="text-gray-400 hover:text-white cursor-pointer">›</button>
            <button className="px-3 py-1 rounded text-xs cursor-pointer" style={{ backgroundColor: "var(--accent)", color: "white" }}>
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: "var(--card-border)" }}>
            {/* Day Headers */}
            {DAYS.map((day, i) => {
              const date = weekDays[i];
              const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              return (
                <div key={day} className="p-2 text-center text-xs font-bold" style={{ backgroundColor: "var(--background)" }}>
                  <span className="text-gray-500">{day}</span>
                </div>
              );
            })}

            {/* Day Cells */}
            {weekDays.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const isToday = dateStr === format(today, "yyyy-MM-dd");
              const dayContent = scheduledByDate[dateStr] || [];

              return (
                <div
                  key={dateStr}
                  className="min-h-[200px] p-2"
                  style={{
                    backgroundColor: isToday ? "#1a2332" : "var(--background)",
                    borderTop: isToday ? "2px solid var(--accent)" : "none",
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const pieceId = e.dataTransfer.getData("pieceId");
                    if (pieceId) handleDrop(pieceId, dateStr);
                  }}
                >
                  <span className={`text-xs ${isToday ? "text-white font-bold" : "text-gray-500"}`}>
                    {format(date, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayContent.map((piece) => (
                      <ContentCard key={piece.id} piece={piece} onClick={() => setSelectedPiece(piece)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedPiece && (
        <CardDetailModal piece={selectedPiece} onClose={() => setSelectedPiece(null)} />
      )}
    </div>
  );
}
