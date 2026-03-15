"use client";

import { useState } from "react";
import { useApp, type ContentPiece } from "@/lib/store";
import { ArrowLeft, Check, Copy, Trash2, MessageSquare } from "lucide-react";

function ContentCard({ piece, onSelect }: { piece: ContentPiece; onSelect: () => void }) {
  const typeLabel = piece.type === "talking_head" ? "WALKING REEL" : "CARRUSEL";
  const typeColor = piece.type === "talking_head" ? "#22c55e" : "#f59e0b";

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-lg cursor-pointer"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ color: typeColor, border: `1px solid ${typeColor}` }}>
          {typeLabel}
        </span>
        {piece.approved && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ color: "var(--badge-high)", border: "1px solid var(--badge-high)" }}>
            Approved
          </span>
        )}
      </div>
      <h3 className="font-medium text-sm truncate">{piece.title}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{piece.content.slice(0, 120)}...</p>
    </button>
  );
}

function ContentEditor({ piece }: { piece: ContentPiece }) {
  const { dispatch } = useApp();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);

  const handleApprove = () => {
    dispatch({ type: "APPROVE_CONTENT", payload: piece.id });
    dispatch({ type: "MOVE_TO_QUEUE", payload: piece.id });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(piece.content);
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);

    try {
      const response = await fetch("/api/edit-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: piece.id,
          currentContent: piece.content,
          message: msg,
          history: chatHistory,
        }),
      });

      if (!response.ok) throw new Error("Chat failed");
      const data = await response.json();

      setChatHistory((prev) => [...prev, { role: "assistant", text: data.reply }]);

      if (data.updatedContent) {
        dispatch({ type: "UPDATE_CONTENT", payload: { id: piece.id, content: data.updatedContent } });
      }
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", text: "Sorry, I had trouble processing that. Please try again." }]);
    }
  };

  const typeLabel = piece.type === "talking_head" ? "Walking Reel" : "Carrusel Educativo";

  return (
    <div className="flex flex-1 h-full">
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
          <span className="text-sm font-medium" style={{ color: "var(--badge-high)" }}>{typeLabel}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="p-2 rounded hover:bg-gray-800 cursor-pointer">
              <Trash2 size={16} className="text-gray-400" />
            </button>
            {!piece.approved ? (
              <button onClick={handleApprove}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
                style={{ backgroundColor: "var(--badge-high)" }}>
                <Check size={14} /> Approve
              </button>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "var(--badge-high)" }}>
                Approved!
              </span>
            )}
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer"
              style={{ backgroundColor: "var(--accent)", color: "white" }}>
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>

        <div className="flex-1 p-8 max-w-2xl">
          {piece.type === "talking_head" && piece.onScreenText && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">On-Screen Text:</h4>
              <p className="text-lg font-medium">&lsquo;{piece.onScreenText}&rsquo;</p>
            </div>
          )}

          {piece.type === "talking_head" ? (
            <>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Puntos para grabar (~30-60s):</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{piece.content}</div>
              {piece.caption && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Caption para Instagram:</h4>
                  <p className="text-sm text-gray-600">{piece.caption}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Slides del Carrusel:</h4>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{piece.content}</div>
              {piece.caption && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Caption para Instagram:</h4>
                  <p className="text-sm text-gray-600">{piece.caption}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor Chat Sidebar */}
      <div className="w-80 flex flex-col border-l" style={{ borderColor: "var(--card-border)", backgroundColor: "var(--sidebar-bg)" }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "var(--card-border)" }}>
          <MessageSquare size={16} style={{ color: "var(--accent)" }} />
          <span className="font-medium text-sm">Editor Chat</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-4">
              <p className="mb-3">Pide cambios o haz preguntas:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Hazlo más corto",
                  "Añade más datos",
                  "Tono más cercano",
                  "Cambia el CTA",
                  "Más emocional",
                  "Añade un ejemplo",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setChatMessage(suggestion); }}
                    className="text-xs px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: "var(--knowledge-bg)", color: "var(--accent)", border: "1px solid var(--card-border)" }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`text-sm p-2 rounded-lg ${msg.role === "user" ? "bg-blue-50 ml-4" : "bg-gray-100 mr-4"}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-3 border-t" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleChat(); }}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}
            />
            <button onClick={handleChat} className="p-2 rounded-lg cursor-pointer" style={{ backgroundColor: "var(--accent)" }}>
              <MessageSquare size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditView() {
  const { state } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPiece = state.generatedContent.find((c) => c.id === selectedId);

  if (state.generatedContent.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <PenIcon />
          <p className="mt-4">No content generated yet.</p>
          <p className="text-sm">Go to Start tab to research and generate content.</p>
        </div>
      </div>
    );
  }

  if (selectedPiece) {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1 p-4 text-sm cursor-pointer" style={{ color: "#8a8580" }}
        >
          <ArrowLeft size={16} /> Back to list
        </button>
        <ContentEditor piece={selectedPiece} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--accent)" }}>
        Content Editor
      </h1>
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {state.generatedContent.map((piece) => (
          <ContentCard key={piece.id} piece={piece} onSelect={() => setSelectedId(piece.id)} />
        ))}
      </div>
    </div>
  );
}

function PenIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}
