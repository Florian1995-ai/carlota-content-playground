"use client";

import { useState } from "react";
import { useApp, type Brand } from "@/lib/store";
import { Search, Upload, Link, Globe, User, GraduationCap, Users, BookOpen } from "lucide-react";
import ResearchView from "./ResearchView";

const defaultBrands: Brand[] = [
  { id: "educator", name: "Carlota Educator", description: "Para profesionales: terapeutas, maestros, educadores", icon: "graduation" },
  { id: "parents", name: "Parents Community", description: "Para madres y padres preocupados por sus hijos", icon: "users" },
  { id: "brandium", name: "Brandium Courses", description: "Marketing de formaciones en neurodesarrollo", icon: "book" },
  { id: "personal", name: "Carlota Personal", description: "Marca personal, liderazgo, día a día", icon: "user" },
];

const iconMap: Record<string, React.ReactNode> = {
  user: <User size={20} />,
  graduation: <GraduationCap size={20} />,
  users: <Users size={20} />,
  book: <BookOpen size={20} />,
};

function BrandSelection() {
  const { dispatch } = useApp();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--accent)" }}>
        Carlota's Content Playground
      </h1>
      <p className="text-sm mb-8" style={{ color: "#8a8580" }}>Investiga, crea y planifica tu contenido educativo</p>
      <h2 className="text-lg font-semibold mb-6">Select Brand Voice</h2>
      <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
        {defaultBrands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => dispatch({ type: "SELECT_BRAND", payload: brand })}
            className="flex items-center gap-3 p-4 rounded-lg cursor-pointer text-left hover:shadow-md"
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--knowledge-bg)", color: "var(--accent)" }}>
              {iconMap[brand.icon] || <Globe size={20} />}
            </div>
            <div>
              <div className="font-medium">{brand.name}</div>
              <div className="text-sm" style={{ color: "#8a8580" }}>{brand.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function NewResearch() {
  const { state, dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);

  const handleStartResearch = async () => {
    if (!url.trim() && !notes.trim()) return;

    dispatch({ type: "SET_RESEARCHING", payload: true });

    let scrapedContent: string | undefined;

    // Auto-detect URL type and scrape
    if (url.trim()) {
      const trimmedUrl = url.trim();
      const isYouTube = trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be");
      const isInstagram = trimmedUrl.includes("instagram.com");
      const isWebsite = trimmedUrl.startsWith("http") && !isYouTube && !isInstagram;

      if (isYouTube || isInstagram || isWebsite) {
        const statusMsg = isYouTube
          ? "Extracting YouTube transcript..."
          : isInstagram
          ? "Scraping Instagram content..."
          : "Scraping website content...";
        const scrapeType = isYouTube ? "youtube" : isInstagram ? "instagram" : "website";

        setScrapeStatus(statusMsg);
        try {
          const scrapeResponse = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmedUrl, type: scrapeType }),
          });
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json();
            scrapedContent = scrapeData.content;
            setScrapeStatus("Content extracted. Researching...");
          } else {
            setScrapeStatus("Scrape failed, researching URL directly...");
          }
        } catch {
          setScrapeStatus("Scrape failed, researching URL directly...");
        }
      }
    }

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          topic: scrapedContent
            ? `Based on this scraped content:\n\n${scrapedContent}\n\nAdditional instructions: ${notes.trim() || "Analyze this content and extract insights relevant to child development, learning difficulties, parenting, and neurodevelopment."}`
            : (notes.trim() || url.trim()),
          brandVoice: state.selectedBrand?.name || "Default",
        }),
      });

      if (!response.ok) throw new Error("Research failed");
      const data = await response.json();
      dispatch({ type: "SET_RESEARCH_BRIEF", payload: data });
    } catch {
      dispatch({ type: "SET_RESEARCHING", payload: false });
      alert("Research failed. Check your API keys and try again.");
    }
    setScrapeStatus(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8">
      <div className="flex items-center justify-between w-full max-w-2xl mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
          Carlota's Content Playground
        </h1>
        <span style={{ color: "#8a8580" }}>{state.selectedBrand?.name}</span>
      </div>

      <div className="w-full max-w-2xl rounded-xl p-6 shadow-sm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Search size={18} style={{ color: "var(--accent)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--accent)" }}>New Research</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "#8a8580" }}>
          Enter a topic (e.g., &quot;sensory integration in early childhood&quot;) or paste a link to analyze.
        </p>

        {/* URL Input */}
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "#8a8580" }}>
            <Link size={12} /> Import from URL (YouTube / Instagram / Website)
          </label>
          <div className="flex items-center rounded-lg overflow-hidden" style={{ backgroundColor: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube, Instagram, or website link..."
              className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder-gray-400"
              style={{ color: "var(--foreground)" }}
            />
            <button className="p-2.5" style={{ color: "#8a8580" }}>
              <Upload size={16} />
            </button>
          </div>
          {url.trim() && (
            <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
              {url.includes("youtube") || url.includes("youtu.be")
                ? "YouTube detected — will extract transcript via Apify"
                : url.includes("instagram")
                ? "Instagram detected — will scrape content via Apify"
                : url.startsWith("http")
                ? "Website detected — will scrape content via Firecrawl"
                : "Link will be passed to research engine"}
            </p>
          )}
        </div>

        {/* File Upload */}
        <div className="mb-4 flex items-center justify-center py-4 rounded-lg border border-dashed cursor-pointer"
          style={{ borderColor: "var(--input-border)" }}>
          <div className="text-center">
            <Upload size={20} className="mx-auto mb-1" style={{ color: "#8a8580" }} />
            <p className="text-xs" style={{ color: "#8a8580" }}>Click to upload PDF, Text, or Image</p>
          </div>
        </div>

        {/* Notes / Instructions */}
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "#8a8580" }}>
            Notes / Instructions
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, angles, or specific instructions here... (Press Enter to start, Shift+Enter for new line)"
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-400 resize-none"
            style={{
              backgroundColor: "var(--input-bg)",
              border: "2px solid var(--accent)",
              color: "var(--foreground)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleStartResearch();
              }
            }}
          />
        </div>

        {/* Scrape Status */}
        {scrapeStatus && (
          <p className="text-sm mb-3 text-center" style={{ color: "var(--accent)" }}>
            {scrapeStatus}
          </p>
        )}

        {/* Start Research Button */}
        <button
          onClick={handleStartResearch}
          disabled={state.isResearching || (!url.trim() && !notes.trim())}
          className="w-full py-3 rounded-lg font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {state.isResearching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">&#9696;</span> Researching...
            </span>
          ) : (
            "Start Research \u2192"
          )}
        </button>
      </div>
    </div>
  );
}

export default function StartView() {
  const { state } = useApp();

  if (state.researchBrief) {
    return <ResearchView />;
  }

  if (!state.selectedBrand) {
    return <BrandSelection />;
  }

  return <NewResearch />;
}
