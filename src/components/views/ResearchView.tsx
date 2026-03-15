"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Copy, Bookmark, Check } from "lucide-react";

function QualityBadge({ quality }: { quality: string }) {
  const colors: Record<string, string> = {
    High: "var(--badge-high)",
    Moderate: "var(--badge-moderate)",
    Emerging: "var(--badge-emerging)",
  };
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: colors[quality] || "#888", border: `1px solid ${colors[quality] || "#888"}` }}
    >
      {quality}
    </span>
  );
}

export default function ResearchView() {
  const { state, dispatch } = useApp();
  const rawBrief = state.researchBrief;
  const [refineQuery, setRefineQuery] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showGenerate, setShowGenerate] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  if (!rawBrief) return null;

  // Defensive: ensure all arrays exist even if API returns unexpected structure
  const brief = {
    ...rawBrief,
    evidence: rawBrief.evidence || [],
    knowledgeBombs: (rawBrief.knowledgeBombs || []).filter((k: { text: string }) => k.text && k.text.length > 0),
    angles: rawBrief.angles || [],
  };

  const contentTypes = [
    { id: "talking_head", name: "Walking Reel", desc: "30-60s — puntos clave para hablar a cámara mientras caminas" },
    { id: "carousel", name: "Carrusel Educativo", desc: "7-9 slides — contenido informativo sobre desarrollo infantil" },
  ];

  const toggleType = (id: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefine = async () => {
    if (!refineQuery.trim() || isRefining) return;
    setIsRefining(true);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Refine this existing research brief:\n\nOriginal topic: ${brief.topic}\nOriginal thesis: ${brief.coreThesis}\n\nRefinement request: ${refineQuery.trim()}\n\nKeep the same JSON structure but incorporate the refinement. Maintain all existing evidence and add new items if relevant.`,
          brandVoice: state.selectedBrand?.name || "Default",
        }),
      });

      if (!response.ok) throw new Error("Refine failed");
      const data = await response.json();
      dispatch({ type: "SET_RESEARCH_BRIEF", payload: data });
      setRefineQuery("");
    } catch {
      alert("No se pudo refinar. Inténtalo de nuevo.");
    }
    setIsRefining(false);
  };

  const handleGenerate = async () => {
    if (selectedTypes.size === 0) return;
    dispatch({ type: "SET_GENERATING", payload: true });

    const selectedAngles = brief.angles.filter((a) => a.selected);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: {
            topic: brief.topic,
            coreThesis: brief.coreThesis,
            evidence: brief.evidence,
            knowledgeBombs: brief.knowledgeBombs,
          },
          angles: selectedAngles,
          contentTypes: Array.from(selectedTypes),
          brandVoice: state.selectedBrand?.name || "Default",
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const data = await response.json();
      dispatch({ type: "ADD_CONTENT", payload: data.content });
      dispatch({ type: "SET_TAB", payload: "edit" });
    } catch {
      dispatch({ type: "SET_GENERATING", payload: false });
      alert("La generación falló. Revisa tus API keys e inténtalo de nuevo.");
    }
  };

  const handleCopyBrief = () => {
    const text = `# ${brief.topic}\n\n## Tesis Principal\n${brief.coreThesis}\n\n## Evidencia Clave\n${brief.evidence.map((e) => `- ${e.finding} (${e.source})`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8 pb-24">
      <div className="flex items-center justify-between w-full max-w-3xl mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
          Generador de Contenido
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{state.selectedBrand?.name}</span>
          <span>›</span>
          <span style={{ color: "var(--badge-high)" }}>Investigación Activa</span>
        </div>
      </div>

      <div className="w-full max-w-3xl">
        {/* Research Brief Card */}
        <div className="bg-white rounded-xl p-6 mb-6 text-gray-900">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>📋</span> Brief de Investigación
            </div>
            <button onClick={handleCopyBrief} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              {copiedBrief ? <Check size={14} /> : <Copy size={14} />}
              {copiedBrief ? "Copiado!" : "Copiar Brief"}
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-4">{brief.topic}</h2>

          {/* Core Thesis */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tesis Principal</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm leading-relaxed">
            {brief.coreThesis}
          </div>

          {/* Key Evidence */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Evidencia Clave</h3>
          <div className="space-y-0 mb-6">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 border-b border-gray-200">
              <span className="text-xs font-bold uppercase text-gray-400">Hallazgo</span>
              <span className="text-xs font-bold uppercase text-gray-400">Fuente</span>
              <span className="text-xs font-bold uppercase text-gray-400">Calidad</span>
            </div>
            {brief.evidence.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 border-b border-gray-100 items-start">
                <p className="text-sm">{item.finding}</p>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline truncate max-w-[160px]">
                  {item.source}
                </a>
                <QualityBadge quality={item.quality} />
              </div>
            ))}
          </div>

          {/* Knowledge Bombs */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1">
            💡 Ideas Clave
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {brief.knowledgeBombs.map((bomb, i) => (
              <div key={i} className="rounded-lg p-3 text-sm italic"
                style={{ backgroundColor: "var(--knowledge-bg)", color: "var(--knowledge-text)" }}>
                {bomb.text}
              </div>
            ))}
          </div>

          {/* Recommended Angles */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
            🎯 Ángulos Recomendados
          </h3>
          <p className="text-xs text-gray-400 mb-3">Selecciona uno o más ángulos para guiar la generación de contenido.</p>
          <div className="space-y-3 mb-6">
            {brief.angles.map((angle) => (
              <button
                key={angle.id}
                onClick={() => dispatch({ type: "TOGGLE_ANGLE", payload: angle.id })}
                className="w-full text-left rounded-xl p-4 cursor-pointer"
                style={{
                  border: angle.selected
                    ? "2px solid var(--angle-selected)"
                    : "1px solid #e5e7eb",
                  backgroundColor: angle.selected ? "#fdf2f8" : "white",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: angle.selected ? "var(--angle-selected)" : "#ccc",
                        backgroundColor: angle.selected ? "var(--angle-selected)" : "transparent",
                      }}>
                      {angle.selected && <Check size={12} className="text-white" />}
                    </div>
                    <h4 className="font-semibold text-sm">{angle.title}</h4>
                  </div>
                  <Bookmark size={16} className="text-gray-300" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Visión Convencional</span>
                    <p className="text-xs text-gray-600 mt-1">{angle.mainstreamView}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent)" }}>Visión Actualizada</span>
                    <p className="text-xs text-gray-600 mt-1">{angle.cuttingEdgeView}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Refine Research */}
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              ✏️ Refinar Investigación
            </h3>
            <p className="text-xs text-gray-400 mb-2">
              Pide al AI que ajuste el brief: añadir ejemplos, cambiar el enfoque, buscar datos específicos.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={refineQuery}
                onChange={(e) => setRefineQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
                placeholder="Ej: Añade estudios sobre Brain Gym, enfócate en niños de 3-6 años..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none"
              />
              <button
                onClick={handleRefine}
                disabled={isRefining || !refineQuery.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isRefining ? "Refinando..." : "Refinar"}
              </button>
            </div>
          </div>
        </div>

        {/* Generate Content Section */}
        {!showGenerate ? (
          <button
            onClick={() => setShowGenerate(true)}
            className="w-full py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: "var(--accent)" }}
          >
            ✨ Generar Contenido
          </button>
        ) : (
          <div className="rounded-xl p-6" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                ✨ Generar Contenido
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className="p-4 rounded-lg text-left cursor-pointer"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    border: selectedTypes.has(type.id)
                      ? "2px solid var(--accent)"
                      : "1px solid var(--card-border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{type.name}</span>
                    <div className="w-5 h-5 rounded border flex items-center justify-center"
                      style={{
                        borderColor: selectedTypes.has(type.id) ? "var(--accent)" : "#555",
                        backgroundColor: selectedTypes.has(type.id) ? "var(--accent)" : "transparent",
                      }}>
                      {selectedTypes.has(type.id) && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              disabled={selectedTypes.size === 0 || state.isGenerating}
              className="w-full py-3 rounded-lg font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {state.isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">&#9696;</span> Generando...
                </span>
              ) : (
                "Generar Contenido Seleccionado"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
