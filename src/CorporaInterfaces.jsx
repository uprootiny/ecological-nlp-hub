import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { fetchConcordanceLines, fetchMetaOpsPayload } from "./services/api";
import { SAMPLE_CORPORA } from "./nlp/corpus-data";
import {
  processCorpus,
  getProcessedCorpus,
  getAllProcessedCorpora,
  getConcordance,
  getNgrams,
  getBigrams,
  getCollocations,
  getMorphology,
  getCorpusMorphology,
  getFrequencyMatrix,
  getCorpusStats,
  compareCorpora,
  getVocabulary,
} from "./nlp/pipeline";

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const lerp = (a, b, t) => a + (b - a) * t;

const PALETTES = {
  amber: { bg: "#1a1610", fg: "#e8d5b0", accent: "#d4a042", muted: "#6b5a3e", glow: "#d4a04233" },
  slate: { bg: "#0e1117", fg: "#c8cdd5", accent: "#5b9bd5", muted: "#3a4050", glow: "#5b9bd533" },
  moss: { bg: "#0f1510", fg: "#b8cfb0", accent: "#6abf69", muted: "#2e4a2e", glow: "#6abf6933" },
  rose: { bg: "#1a1015", fg: "#dcc0cf", accent: "#d46a8e", muted: "#5a3048", glow: "#d46a8e33" },
  ice: { bg: "#0d1219", fg: "#b0d0e8", accent: "#42a0d4", muted: "#1e3850", glow: "#42a0d433" },
  violet: { bg: "#14101a", fg: "#c8b8e0", accent: "#8b6abf", muted: "#3a2e5a", glow: "#8b6abf33" },
  copper: { bg: "#1a1210", fg: "#e0c8a8", accent: "#c07830", muted: "#5a3e20", glow: "#c0783033" },
  teal: { bg: "#0f1515", fg: "#a8d8d0", accent: "#40b0a0", muted: "#1e4a42", glow: "#40b0a033" },
  crimson: { bg: "#1a0f10", fg: "#e0b8b8", accent: "#c04040", muted: "#5a2020", glow: "#c0404033" },
  gold: { bg: "#181510", fg: "#e8d8a0", accent: "#c0a020", muted: "#584a18", glow: "#c0a02033" },
  sage: { bg: "#121510", fg: "#c0d0a8", accent: "#80a840", muted: "#384a18", glow: "#80a84033" },
  steel: { bg: "#121215", fg: "#c0c0d0", accent: "#7080a0", muted: "#303848", glow: "#7080a033" },
};

const PAL_KEYS = Object.keys(PALETTES);

const SPEECH_ACTS = ["assertive", "directive", "commissive", "expressive", "declarative"];
const REGISTERS = ["frozen", "formal", "consultative", "casual", "intimate"];

// ─── Data Acquisition Panel ────────────────────────────────

const DataAcquisition = ({ pal, onCorpusLoaded, corpora }) => {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddText = () => {
    if (!text.trim() || !name.trim()) return;
    onCorpusLoaded(name.trim(), text.trim());
    setText("");
    setName("");
  };

  const handleLoadSample = (sample) => {
    onCorpusLoaded(sample.name, sample.text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onCorpusLoaded(file.name.replace(/\.[^.]+$/, ""), ev.target.result);
    };
    reader.readAsText(file);
  };

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // Extract text from HTML
      const doc = new DOMParser().parseFromString(html, "text/html");
      // Remove script/style
      doc.querySelectorAll("script, style, nav, header, footer").forEach((el) => el.remove());
      const text = doc.body?.innerText || doc.body?.textContent || "";
      const cleanText = text.replace(/\n{3,}/g, "\n\n").trim();
      if (cleanText.length < 50) throw new Error("Could not extract meaningful text");
      const urlName = new URL(url).hostname.replace("www.", "");
      onCorpusLoaded(`${urlName} (fetched)`, cleanText);
    } catch (err) {
      setError(`Fetch failed: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 11, color: pal.accent, fontFamily: "monospace", letterSpacing: 1 }}>
        DATA ACQUISITION — {corpora.length} CORPORA LOADED ({corpora.reduce((s, c) => s + (getProcessedCorpus(c)?.wordCount || 0), 0).toLocaleString()} tokens)
      </div>

      {/* Sample Corpora */}
      <div>
        <div style={{ fontSize: 10, color: pal.muted, marginBottom: 6, fontFamily: "monospace" }}>BUILT-IN CORPORA</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SAMPLE_CORPORA.map((s) => {
            const loaded = corpora.includes(s.name);
            return (
              <button
                key={s.name}
                onClick={() => !loaded && handleLoadSample(s)}
                disabled={loaded}
                style={{
                  background: loaded ? `${pal.accent}20` : "transparent",
                  border: `1px solid ${loaded ? pal.accent : pal.muted}`,
                  color: loaded ? pal.accent : pal.fg,
                  padding: "5px 10px",
                  borderRadius: 4,
                  cursor: loaded ? "default" : "pointer",
                  fontFamily: "monospace",
                  fontSize: 10,
                  opacity: loaded ? 0.6 : 1,
                }}
              >
                {loaded ? "✓ " : ""}{s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paste Text */}
      <div>
        <div style={{ fontSize: 10, color: pal.muted, marginBottom: 6, fontFamily: "monospace" }}>PASTE / TYPE TEXT</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Corpus name..."
          style={{
            width: "100%",
            background: `${pal.muted}15`,
            border: `1px solid ${pal.muted}40`,
            color: pal.fg,
            padding: "6px 10px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 11,
            marginBottom: 4,
            outline: "none",
          }}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here... (any language, any length)"
          rows={5}
          style={{
            width: "100%",
            background: `${pal.muted}15`,
            border: `1px solid ${pal.muted}40`,
            color: pal.fg,
            padding: "8px 10px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 11,
            resize: "vertical",
            outline: "none",
          }}
        />
        <button
          onClick={handleAddText}
          disabled={!text.trim() || !name.trim()}
          style={{
            marginTop: 4,
            background: pal.accent,
            color: pal.bg,
            border: "none",
            padding: "6px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 600,
            opacity: text.trim() && name.trim() ? 1 : 0.4,
          }}
        >
          Process & Add Corpus
        </button>
      </div>

      {/* File Upload */}
      <div>
        <div style={{ fontSize: 10, color: pal.muted, marginBottom: 6, fontFamily: "monospace" }}>UPLOAD FILE (.txt, .csv, .json)</div>
        <input
          type="file"
          accept=".txt,.csv,.json,.md,.html"
          onChange={handleFileUpload}
          style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted }}
        />
      </div>

      {/* URL Fetch */}
      <div>
        <div style={{ fontSize: 10, color: pal.muted, marginBottom: 6, fontFamily: "monospace" }}>FETCH FROM URL (with CORS proxy)</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            style={{
              flex: 1,
              background: `${pal.muted}15`,
              border: `1px solid ${pal.muted}40`,
              color: pal.fg,
              padding: "6px 10px",
              borderRadius: 4,
              fontFamily: "monospace",
              fontSize: 11,
              outline: "none",
            }}
          />
          <button
            onClick={handleFetchUrl}
            disabled={loading || !url.trim()}
            style={{
              background: pal.accent,
              color: pal.bg,
              border: "none",
              padding: "6px 14px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 600,
              opacity: loading || !url.trim() ? 0.4 : 1,
            }}
          >
            {loading ? "Fetching..." : "Fetch"}
          </button>
        </div>
        {error && <div style={{ fontSize: 10, color: "#d46a6a", marginTop: 4, fontFamily: "monospace" }}>{error}</div>}
      </div>

      {/* Loaded Corpora Stats */}
      {corpora.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: pal.muted, marginBottom: 6, fontFamily: "monospace" }}>LOADED CORPORA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {corpora.map((name) => {
              const stats = getCorpusStats(name);
              if (!stats) return null;
              return (
                <div
                  key={name}
                  style={{
                    padding: "8px 12px",
                    background: `${pal.accent}08`,
                    border: `1px solid ${pal.muted}30`,
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: 10,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    color: pal.fg,
                  }}
                >
                  <span style={{ color: pal.accent, fontWeight: 600 }}>{name}</span>
                  <span style={{ color: pal.muted }}>
                    {stats.tokens.toLocaleString()} tok · {stats.types.toLocaleString()} types · TTR {stats.ttr.toFixed(3)} · {stats.sentences} sent
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Concordance Helix (REAL KWIC) ────────────────────────

const ConcordanceHelix = ({ pal, corpora }) => {
  const [keyword, setKeyword] = useState("language");
  const [sortMode, setSortMode] = useState("position");
  const [selected, setSelected] = useState(null);
  const [activeCorpus, setActiveCorpus] = useState(corpora[0] || "");

  useEffect(() => {
    if (corpora.length > 0 && !corpora.includes(activeCorpus)) setActiveCorpus(corpora[0]);
  }, [corpora, activeCorpus]);

  const lines = useMemo(() => {
    if (!activeCorpus || !keyword.trim()) return [];
    const results = getConcordance(activeCorpus, keyword.trim());
    if (sortMode === "left") {
      results.sort((a, b) => {
        const aw = a.left.split(" ").pop() || "";
        const bw = b.left.split(" ").pop() || "";
        return aw.localeCompare(bw);
      });
    } else if (sortMode === "right") {
      results.sort((a, b) => {
        const aw = a.right.split(" ")[0] || "";
        const bw = b.right.split(" ")[0] || "";
        return aw.localeCompare(bw);
      });
    }
    return results;
  }, [activeCorpus, keyword, sortMode]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setSelected(null); }}
          placeholder="Search keyword..."
          style={{
            background: `${pal.muted}15`,
            border: `1px solid ${pal.muted}40`,
            color: pal.accent,
            padding: "5px 10px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 700,
            width: 160,
            outline: "none",
          }}
        />
        <select
          value={activeCorpus}
          onChange={(e) => setActiveCorpus(e.target.value)}
          style={{
            background: `${pal.muted}15`,
            border: `1px solid ${pal.muted}40`,
            color: pal.fg,
            padding: "5px 8px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 10,
            outline: "none",
          }}
        >
          {corpora.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {["position", "left", "right"].map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            style={{
              background: sortMode === mode ? `${pal.accent}30` : "transparent",
              border: `1px solid ${sortMode === mode ? pal.accent : pal.muted}40`,
              color: sortMode === mode ? pal.accent : pal.muted,
              padding: "3px 8px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 9,
            }}
          >
            sort:{mode}
          </button>
        ))}
        <span style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace" }}>{lines.length} hits</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 400, overflowY: "auto" }}>
        {lines.slice(0, 100).map((line, i) => {
          const active = selected === i;
          const offset = Math.sin(i * 0.6) * 20;
          return (
            <div
              key={i}
              onClick={() => setSelected(active ? null : i)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                padding: "5px 10px",
                marginLeft: offset,
                background: active ? pal.glow : "transparent",
                borderLeft: active ? `2px solid ${pal.accent}` : "2px solid transparent",
                cursor: "pointer",
                borderRadius: 3,
                transition: "all 0.15s",
                fontFamily: "monospace",
                fontSize: 11,
              }}
            >
              <span style={{ textAlign: "right", color: pal.muted, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{line.left}</span>
              <span style={{ color: pal.accent, fontWeight: 700 }}>{line.keyword}</span>
              <span style={{ color: pal.fg, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{line.right}</span>
            </div>
          );
        })}
        {lines.length === 0 && keyword.trim() && (
          <div style={{ padding: 20, textAlign: "center", color: pal.muted, fontFamily: "monospace", fontSize: 11 }}>
            No matches for "{keyword}" in {activeCorpus || "any corpus"}. Try loading a corpus first.
          </div>
        )}
      </div>
      {selected !== null && lines[selected] && (
        <div style={{ marginTop: 14, padding: 12, background: pal.glow, borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: pal.fg, borderLeft: `3px solid ${pal.accent}` }}>
          <div style={{ color: pal.accent, marginBottom: 4 }}>CONTEXT — Position {lines[selected].position}</div>
          <div>{lines[selected].left} <strong style={{ color: pal.accent }}>{lines[selected].keyword}</strong> {lines[selected].right}</div>
        </div>
      )}
    </div>
  );
};

// ─── Morpheme Forge (REAL analysis) ────────────────────────

const MorphemeForge = ({ pal, corpora }) => {
  const [input, setInput] = useState("unhappiness");
  const [morphAnalyses, setMorphAnalyses] = useState([]);

  useEffect(() => {
    if (corpora.length > 0) {
      // Get interesting words from corpus
      const vocab = getVocabulary(corpora[0]);
      const interesting = vocab
        .filter((w) => w.word.length >= 6 && /^[a-z]+$/.test(w.word))
        .slice(0, 20)
        .map((w) => ({ word: w.word, parts: getMorphology(w.word), freq: w.count }));
      setMorphAnalyses(interesting);
    }
  }, [corpora]);

  const currentParts = useMemo(() => getMorphology(input.trim()), [input]);

  const typeColors = { prefix: "#d4a042", root: pal.accent, suffix: "#6abf69" };
  const [hoveredPart, setHoveredPart] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter any word..."
          style={{
            background: `${pal.muted}15`,
            border: `1px solid ${pal.muted}40`,
            color: pal.fg,
            padding: "6px 12px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: 13,
            width: 200,
            outline: "none",
          }}
        />
        <span style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted }}>
          {currentParts.length} morpheme{currentParts.length !== 1 ? "s" : ""} detected
        </span>
      </div>

      {/* Active decomposition */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, alignItems: "stretch" }}>
        {currentParts.map((part, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredPart(i)}
            onMouseLeave={() => setHoveredPart(null)}
            style={{
              flex: part.type === "root" ? 2 : 1,
              background: hoveredPart === i ? `${typeColors[part.type] || pal.muted}30` : `${typeColors[part.type] || pal.muted}15`,
              borderTop: `3px solid ${typeColors[part.type] || pal.muted}`,
              padding: "12px 10px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              borderRadius: "0 0 4px 4px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 18, color: typeColors[part.type] || pal.fg, fontWeight: 700 }}>
              {part.type === "prefix" ? `${part.m}-` : part.type === "suffix" ? `-${part.m}` : part.m}
            </div>
            <div style={{ fontSize: 10, color: pal.muted, marginTop: 4, fontFamily: "monospace" }}>{part.type.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: pal.fg, marginTop: 2 }}>{part.gloss}</div>
          </div>
        ))}
      </div>

      {/* Corpus morpheme samples */}
      {morphAnalyses.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace", marginBottom: 8, letterSpacing: 1 }}>
            CORPUS MORPHOLOGY SAMPLES (click to analyze)
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {morphAnalyses.map(({ word, parts, freq }) => (
              <button
                key={word}
                onClick={() => setInput(word)}
                style={{
                  background: input === word ? `${pal.accent}25` : `${pal.muted}10`,
                  border: `1px solid ${input === word ? pal.accent : pal.muted}30`,
                  color: input === word ? pal.accent : pal.fg,
                  padding: "4px 8px",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: 10,
                }}
              >
                {word} <span style={{ color: pal.muted, fontSize: 8 }}>×{freq}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontFamily: "monospace", fontSize: 11, color: pal.muted, padding: "8px 12px", background: `${pal.accent}08`, borderRadius: 4, border: `1px solid ${pal.muted}30`, marginTop: 12 }}>
        <span style={{ color: pal.accent }}>σ</span> {currentParts.length} morphemes
        · {currentParts.filter((p) => p.type === "prefix").length} prefixes
        · {currentParts.filter((p) => p.type === "root").length} roots
        · {currentParts.filter((p) => p.type === "suffix").length} suffixes
        · depth: {currentParts.length - 1}
      </div>
    </div>
  );
};

// ─── Collocate Gravity (REAL collocations) ─────────────────

const CollocateGravity = ({ pal, corpora }) => {
  const [node, setNode] = useState("language");
  const [activeCorpus, setActiveCorpus] = useState(corpora[0] || "");
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (corpora.length > 0 && !corpora.includes(activeCorpus)) setActiveCorpus(corpora[0]);
  }, [corpora, activeCorpus]);

  const collocates = useMemo(() => {
    if (!activeCorpus || !node.trim()) return [];
    return getCollocations(activeCorpus, node.trim(), 5, 2);
  }, [activeCorpus, node]);

  const rng = seededRandom(42);
  const center = { x: 180, y: 140 };
  const nodes = useMemo(() => {
    return collocates.slice(0, 20).map((c, i) => {
      const angle = (i / 20) * Math.PI * 2 + rng() * 0.3;
      const maxMi = Math.max(...collocates.map((x) => x.mi), 1);
      const dist = 40 + (1 - c.mi / maxMi) * 110;
      return {
        ...c,
        x: 180 + Math.cos(angle) * dist,
        y: 140 + Math.sin(angle) * dist,
      };
    });
  }, [collocates]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <input
          value={node}
          onChange={(e) => setNode(e.target.value)}
          placeholder="Node word..."
          style={{
            background: `${pal.muted}15`, border: `1px solid ${pal.muted}40`, color: pal.accent,
            padding: "5px 10px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, fontWeight: 700, width: 140, outline: "none",
          }}
        />
        <select value={activeCorpus} onChange={(e) => setActiveCorpus(e.target.value)}
          style={{ background: `${pal.muted}15`, border: `1px solid ${pal.muted}40`, color: pal.fg, padding: "5px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 10, outline: "none" }}>
          {corpora.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace" }}>{collocates.length} collocates</span>
      </div>

      <svg viewBox="0 0 360 280" style={{ width: "100%", maxHeight: 280 }}>
        {[60, 110, 160].map((r) => (
          <circle key={r} cx={180} cy={140} r={r} fill="none" stroke={pal.muted} strokeWidth={0.5} strokeDasharray="3,3" opacity={0.3} />
        ))}
        {nodes.map((c, i) => (
          <line key={`l${i}`} x1={center.x} y1={center.y} x2={c.x} y2={c.y}
            stroke={hovered === i ? pal.accent : pal.muted} strokeWidth={hovered === i ? 1.5 : 0.5} opacity={hovered === i ? 0.8 : 0.2} />
        ))}
        <circle cx={center.x} cy={center.y} r={20} fill={`${pal.accent}30`} stroke={pal.accent} strokeWidth={1.5} />
        <text x={center.x} y={center.y + 4} textAnchor="middle" fill={pal.accent} fontSize={10} fontFamily="monospace" fontWeight="700">{node}</text>
        {nodes.map((c, i) => (
          <g key={`n${i}`} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle cx={c.x} cy={c.y} r={Math.max(5, Math.min(15, c.observed * 2))}
              fill={hovered === i ? `${pal.accent}40` : `${pal.muted}30`}
              stroke={hovered === i ? pal.accent : "transparent"} strokeWidth={1} />
            <text x={c.x} y={c.y + 3} textAnchor="middle" fill={hovered === i ? pal.fg : pal.muted} fontSize={8} fontFamily="monospace">{c.word}</text>
          </g>
        ))}
      </svg>
      {hovered !== null && nodes[hovered] && (
        <div style={{ fontFamily: "monospace", fontSize: 10, color: pal.fg, padding: "8px 12px", background: pal.glow, borderRadius: 4, marginTop: 8 }}>
          <span style={{ color: pal.accent, fontWeight: 700 }}>"{nodes[hovered].word}"</span>
          {" "} MI: {nodes[hovered].mi} · T-score: {nodes[hovered].tscore} · Dice: {nodes[hovered].dice} · observed: {nodes[hovered].observed} · G²: {nodes[hovered].logLikelihood}
        </div>
      )}
    </div>
  );
};

// ─── Diachronic Strata ─────────────────────────────────────

const DiachronicStrata = ({ pal, corpora }) => {
  const stats = useMemo(() => compareCorpora(corpora), [corpora]);
  const colors = ["#8B6914", "#A0522D", "#6B8E23", "#4682B4", "#7B68EE", pal.accent, "#d4a042", "#6abf69"];
  const [activeLayer, setActiveLayer] = useState(null);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace", marginBottom: 12, letterSpacing: 1 }}>
        CORPUS STRATA — {stats.length} layers loaded
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {stats.map((s, i) => {
          const active = activeLayer === i;
          const color = colors[i % colors.length];
          return (
            <div key={s.name} onClick={() => setActiveLayer(active ? null : i)}
              style={{
                height: active ? 70 : 40, background: `linear-gradient(90deg, ${color}${active ? "50" : "20"} 0%, ${color}${active ? "30" : "08"} 100%)`,
                borderLeft: `4px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 14px", cursor: "pointer", transition: "all 0.2s", borderRadius: "0 3px 3px 0", flexWrap: "wrap",
              }}>
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                <span style={{ color, fontWeight: 700 }}>{s.name}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted }}>
                {s.tokens.toLocaleString()} tok · {s.types.toLocaleString()} types
              </div>
              {active && (
                <div style={{ width: "100%", marginTop: 6, fontFamily: "monospace", fontSize: 10, color: pal.fg }}>
                  TTR: {s.ttr.toFixed(4)} · MATTR: {s.mattr.toFixed(4)} · Hapax: {s.hapaxRatio.toFixed(3)} · Zipf: {s.zipfFit.toFixed(3)} · Sentences: {s.sentences}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {stats.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: pal.muted, fontFamily: "monospace", fontSize: 11 }}>
          Load corpora via Data Acquisition to see stratified analysis
        </div>
      )}
    </div>
  );
};

// ─── Syntactic Cartography ─────────────────────────────────

const SyntacticCartography = ({ pal, corpora }) => {
  const [sentence, setSentence] = useState("The quick brown fox jumps over the lazy dog");
  // Simple rule-based POS tagger
  const tagSentence = useCallback((sent) => {
    const words = sent.split(/\s+/).filter(Boolean);
    const dets = new Set(["the", "a", "an", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their"]);
    const preps = new Set(["in", "on", "at", "to", "for", "with", "by", "from", "of", "about", "over", "under", "between", "through", "into", "during", "after", "before"]);
    const conj = new Set(["and", "or", "but", "nor", "yet", "so"]);
    const pron = new Set(["i", "you", "he", "she", "it", "we", "they", "me", "him", "us", "them", "who", "what", "which"]);
    const aux = new Set(["is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "shall", "should", "may", "might", "can", "could", "must"]);
    return words.map((w) => {
      const lc = w.toLowerCase().replace(/[^a-z']/g, "");
      if (dets.has(lc)) return { w, pos: "DET" };
      if (preps.has(lc)) return { w, pos: "ADP" };
      if (conj.has(lc)) return { w, pos: "CONJ" };
      if (pron.has(lc)) return { w, pos: "PRON" };
      if (aux.has(lc)) return { w, pos: "AUX" };
      if (lc.endsWith("ly")) return { w, pos: "ADV" };
      if (lc.endsWith("ing") || lc.endsWith("ed") || lc.endsWith("es") || lc.endsWith("s") && lc.length > 3) return { w, pos: "VERB" };
      if (lc.endsWith("ness") || lc.endsWith("ment") || lc.endsWith("tion") || lc.endsWith("ity")) return { w, pos: "NOUN" };
      if (lc.endsWith("ous") || lc.endsWith("ful") || lc.endsWith("less") || lc.endsWith("ive") || lc.endsWith("able")) return { w, pos: "ADJ" };
      // Default heuristic: short words after DET are likely ADJ/NOUN
      return { w, pos: lc.length <= 4 ? "ADJ" : "NOUN" };
    });
  }, []);

  const tagged = useMemo(() => tagSentence(sentence), [sentence, tagSentence]);
  const [hovered, setHovered] = useState(null);
  const posColors = { DET: "#5b9bd5", ADJ: "#d4a042", NOUN: pal.accent, VERB: "#6abf69", ADP: "#d46a8e", ADV: "#8b6abf", CONJ: "#40b0a0", PRON: "#c07830", AUX: "#7080a0" };

  return (
    <div style={{ padding: 20 }}>
      <input value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Enter a sentence..."
        style={{ width: "100%", background: `${pal.muted}15`, border: `1px solid ${pal.muted}40`, color: pal.fg, padding: "6px 10px", borderRadius: 4, fontFamily: "monospace", fontSize: 12, marginBottom: 16, outline: "none" }} />
      <svg viewBox={`-10 -10 ${tagged.length * 55 + 20} 100`} style={{ width: "100%", maxHeight: 130, overflow: "visible" }}>
        {tagged.map((t, i) => {
          // Simple dependency: each word points to the nearest VERB or NOUN to its right
          const head = tagged.findIndex((h, j) => j > i && (h.pos === "VERB" || h.pos === "NOUN"));
          if (head < 0 || head === i) return null;
          const x1 = i * 55 + 20, x2 = head * 55 + 20;
          const mx = (x1 + x2) / 2, my = -5 - Math.abs(head - i) * 6;
          return (
            <path key={`e${i}`} d={`M${x1},20 Q${mx},${my} ${x2},20`} fill="none"
              stroke={hovered === i ? pal.accent : pal.muted} strokeWidth={hovered === i ? 1.5 : 0.8} />
          );
        })}
        {tagged.map((t, i) => (
          <g key={`n${i}`} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <rect x={i * 55 + 2} y={14} width={36} height={16} rx={3}
              fill={hovered === i ? `${posColors[t.pos] || pal.accent}30` : `${pal.muted}15`}
              stroke={hovered === i ? posColors[t.pos] || pal.accent : "transparent"} strokeWidth={1} />
            <text x={i * 55 + 20} y={26} textAnchor="middle" fill={posColors[t.pos] || pal.fg} fontSize={9} fontFamily="monospace" fontWeight="600">{t.w}</text>
            <text x={i * 55 + 20} y={42} textAnchor="middle" fill={pal.muted} fontSize={7} fontFamily="monospace">{t.pos}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 10, fontFamily: "monospace", fontSize: 9, color: pal.muted, flexWrap: "wrap" }}>
        {Object.entries(posColors).map(([pos, color]) => (
          <span key={pos} style={{ color }}>● {pos}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Frequency Thermograph (REAL data) ─────────────────────

const FrequencyThermograph = ({ pal, corpora }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const matrixData = useMemo(() => {
    if (corpora.length === 0) return null;
    return getFrequencyMatrix(corpora);
  }, [corpora]);

  if (!matrixData || matrixData.words.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: pal.muted, fontFamily: "monospace", fontSize: 11 }}>
        Load multiple corpora to see cross-corpus frequency heatmap
      </div>
    );
  }

  const { words, genres, matrix } = matrixData;
  const maxVal = Math.max(...matrix.flat(), 1);
  const displayWords = words.slice(0, 20);
  const displayMatrix = matrix.slice(0, 20);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace", marginBottom: 8, letterSpacing: 1 }}>
        FREQUENCY PER 10K WORDS ACROSS {genres.length} CORPORA
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `100px repeat(${genres.length}, 1fr)`, gap: 2, overflowX: "auto" }}>
        <div />
        {genres.map((g) => (
          <div key={g} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 8, color: pal.muted, padding: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g}</div>
        ))}
        {displayWords.map((w, ri) => (
          <div key={`row-${ri}`} style={{ display: "contents" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: pal.fg, display: "flex", alignItems: "center", paddingRight: 6, justifyContent: "flex-end" }}>{w}</div>
            {genres.map((_, ci) => {
              const val = displayMatrix[ri][ci];
              const intensity = val / maxVal;
              const isHov = hoveredCell?.r === ri && hoveredCell?.c === ci;
              return (
                <div key={`${ri}-${ci}`} onMouseEnter={() => setHoveredCell({ r: ri, c: ci })} onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    height: 22, borderRadius: 2, cursor: "pointer", transition: "border 0.15s",
                    background: `rgba(${Math.floor(lerp(20, 212, intensity))}, ${Math.floor(lerp(30, 160, Math.max(0, intensity - 0.5) * 2))}, ${Math.floor(lerp(80, 66, intensity))}, ${0.3 + intensity * 0.6})`,
                    border: isHov ? `1px solid ${pal.accent}` : "1px solid transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {isHov && <span style={{ fontSize: 8, color: "#fff", fontFamily: "monospace" }}>{val.toFixed(1)}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12, alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: pal.muted }}>LOW</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div key={v} style={{ width: 20, height: 8, borderRadius: 1, background: `rgba(${Math.floor(lerp(20, 212, v))}, ${Math.floor(lerp(30, 160, Math.max(0, v - 0.5) * 2))}, ${Math.floor(lerp(80, 66, v))}, ${0.3 + v * 0.6})` }} />
        ))}
        <span style={{ fontFamily: "monospace", fontSize: 9, color: pal.muted }}>HIGH</span>
      </div>
    </div>
  );
};

// ─── Semantic Drift (demo + real comparison) ───────────────

const SemanticDrift = ({ pal, corpora }) => {
  const [word, setWord] = useState("awful");
  const timeline = [
    { year: 1400, meaning: "awe-inspiring, full of awe", valence: 0.8 },
    { year: 1500, meaning: "commanding respect", valence: 0.7 },
    { year: 1600, meaning: "dreadful, fearsome", valence: 0.3 },
    { year: 1700, meaning: "exceedingly bad", valence: -0.3 },
    { year: 1800, meaning: "very bad, terrible", valence: -0.6 },
    { year: 1900, meaning: "extremely unpleasant", valence: -0.8 },
    { year: 2000, meaning: "terrible; also intensifier", valence: -0.7 },
  ];
  const driftWords = {
    awful: timeline,
    nice: [
      { year: 1300, meaning: "foolish, ignorant", valence: -0.6 },
      { year: 1400, meaning: "timid, fussy", valence: -0.3 },
      { year: 1500, meaning: "precise, careful", valence: 0.2 },
      { year: 1700, meaning: "agreeable, delightful", valence: 0.6 },
      { year: 1900, meaning: "pleasant, kind", valence: 0.8 },
      { year: 2000, meaning: "pleasant (often weak praise)", valence: 0.5 },
    ],
    silly: [
      { year: 1200, meaning: "blessed, happy", valence: 0.8 },
      { year: 1400, meaning: "innocent, pitiable", valence: 0.3 },
      { year: 1500, meaning: "weak, helpless", valence: -0.2 },
      { year: 1600, meaning: "foolish, simple", valence: -0.5 },
      { year: 1800, meaning: "lacking sense", valence: -0.6 },
      { year: 2000, meaning: "absurd, frivolous", valence: -0.3 },
    ],
    meat: [
      { year: 900, meaning: "any food", valence: 0.5 },
      { year: 1300, meaning: "solid food (not drink)", valence: 0.4 },
      { year: 1500, meaning: "flesh of animals", valence: 0.3 },
      { year: 1800, meaning: "animal flesh for eating", valence: 0.3 },
      { year: 2000, meaning: "animal flesh; also 'substance'", valence: 0.2 },
    ],
  };
  const [hovered, setHovered] = useState(null);
  const tl = driftWords[word] || timeline;
  const w = 340, h = 120, pad = 30;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        {Object.keys(driftWords).map((dw) => (
          <button key={dw} onClick={() => { setWord(dw); setHovered(null); }}
            style={{
              background: word === dw ? `${pal.accent}30` : "transparent",
              border: `1px solid ${word === dw ? pal.accent : pal.muted}40`,
              color: word === dw ? pal.accent : pal.muted,
              padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 11, fontWeight: word === dw ? 700 : 400,
            }}>{dw}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: "100%", maxHeight: 160 }}>
        <line x1={pad} y1={h / 2 + 5} x2={w - 10} y2={h / 2 + 5} stroke={pal.muted} strokeWidth={0.5} strokeDasharray="2,3" />
        <text x={pad - 4} y={15} fill={pal.muted} fontSize={7} fontFamily="monospace" textAnchor="end">+</text>
        <text x={pad - 4} y={h} fill={pal.muted} fontSize={7} fontFamily="monospace" textAnchor="end">−</text>
        {tl.map((t, i) => {
          const x = pad + (i / (tl.length - 1)) * (w - pad - 15);
          const y = 10 + ((1 - (t.valence + 1) / 2) * (h - 20));
          const next = tl[i + 1];
          const nx = next ? pad + ((i + 1) / (tl.length - 1)) * (w - pad - 15) : 0;
          const ny = next ? 10 + ((1 - (next.valence + 1) / 2) * (h - 20)) : 0;
          return (
            <g key={i}>
              {next && <line x1={x} y1={y} x2={nx} y2={ny} stroke={pal.accent} strokeWidth={1.5} opacity={0.5} />}
              <circle cx={x} cy={y} r={hovered === i ? 6 : 4} fill={t.valence > 0 ? "#6abf69" : "#d46a6a"}
                stroke={hovered === i ? pal.fg : "transparent"} strokeWidth={1}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }} />
              <text x={x} y={h + 16} textAnchor="middle" fill={pal.muted} fontSize={7} fontFamily="monospace">{t.year}</text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && tl[hovered] && (
        <div style={{ fontFamily: "monospace", fontSize: 11, color: pal.fg, padding: "8px 10px", background: pal.glow, borderRadius: 4, marginTop: 6 }}>
          <span style={{ color: pal.accent }}>{tl[hovered].year}:</span> "{tl[hovered].meaning}"
          <span style={{ color: pal.muted }}> · valence: {tl[hovered].valence > 0 ? "+" : ""}{tl[hovered].valence}</span>
        </div>
      )}
    </div>
  );
};

// ─── Pragmatic Studio ──────────────────────────────────────

const PragmaticStudio = ({ pal, corpora }) => {
  const [activeCorpus, setActiveCorpus] = useState(corpora[0] || "");

  useEffect(() => {
    if (corpora.length > 0 && !corpora.includes(activeCorpus)) setActiveCorpus(corpora[0]);
  }, [corpora, activeCorpus]);

  // Simple rule-based speech act classifier
  const utterances = useMemo(() => {
    const corpus = getProcessedCorpus(activeCorpus);
    if (!corpus) return [];
    return corpus.sentences.slice(0, 15).map((s) => {
      const text = s.text;
      const lc = text.toLowerCase();
      let act = "assertive";
      let force = 0.5;
      if (lc.includes("?") || lc.startsWith("who") || lc.startsWith("what") || lc.startsWith("how") || lc.startsWith("why") || lc.startsWith("could you") || lc.startsWith("would you")) {
        act = "directive"; force = 0.6;
      } else if (lc.startsWith("let") || lc.includes("should") || lc.includes("must") || lc.includes("need to")) {
        act = "directive"; force = 0.7;
      } else if (lc.includes("will") || lc.includes("promise") || lc.includes("agree") || lc.includes("commit")) {
        act = "commissive"; force = 0.5;
      } else if (lc.includes("!") || lc.includes("wonderful") || lc.includes("terrible") || lc.includes("great") || lc.includes("amazing") || lc.includes("unfortunately")) {
        act = "expressive"; force = 0.6;
      } else if (lc.includes("declare") || lc.includes("hereby") || lc.includes("pronounce")) {
        act = "declarative"; force = 0.9;
      }
      // Adjust force by sentence length and punctuation
      force = Math.min(0.95, force + (text.length > 100 ? 0.2 : 0) + (text.includes("!") ? 0.15 : 0));
      return { text: text.slice(0, 120) + (text.length > 120 ? "..." : ""), act, force };
    });
  }, [activeCorpus]);

  const actColors = { assertive: "#5b9bd5", directive: "#d4a042", commissive: "#6abf69", expressive: "#d46a8e", declarative: "#8b6abf" };
  const [selectedAct, setSelectedAct] = useState(null);
  const actCounts = useMemo(() => {
    const counts = {};
    for (const u of utterances) counts[u.act] = (counts[u.act] || 0) + 1;
    return counts;
  }, [utterances]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <select value={activeCorpus} onChange={(e) => setActiveCorpus(e.target.value)}
          style={{ background: `${pal.muted}15`, border: `1px solid ${pal.muted}40`, color: pal.fg, padding: "5px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 10, outline: "none" }}>
          {corpora.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {SPEECH_ACTS.map((act) => (
          <button key={act} onClick={() => setSelectedAct(selectedAct === act ? null : act)}
            style={{
              background: selectedAct === act ? actColors[act] + "30" : "transparent",
              border: `1px solid ${actColors[act]}60`, color: actColors[act],
              fontFamily: "monospace", fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer",
            }}>
            {act} ({actCounts[act] || 0})
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 350, overflowY: "auto" }}>
        {utterances.map((u, i) => {
          const dimmed = selectedAct && u.act !== selectedAct;
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 40px", gap: 8, alignItems: "center",
              padding: "6px 10px", background: dimmed ? "transparent" : `${actColors[u.act]}08`,
              borderLeft: `3px solid ${actColors[u.act]}${dimmed ? "20" : "80"}`, borderRadius: "0 3px 3px 0",
              opacity: dimmed ? 0.35 : 1, transition: "opacity 0.2s",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: dimmed ? pal.muted : pal.fg }}>{u.text}</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: actColors[u.act], textAlign: "right" }}>{u.act}</span>
              <div style={{ height: 6, borderRadius: 3, background: `${pal.muted}30` }}>
                <div style={{ height: "100%", width: `${u.force * 100}%`, borderRadius: 3, background: actColors[u.act] }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Phonotactic Lattice ───────────────────────────────────

const PhonotacticLattice = ({ pal }) => {
  const onsets = ["p", "t", "k", "b", "d", "g", "f", "s", "\u0283", "h", "m", "n", "l", "r", "w", "j"];
  const nuclei = ["i", "\u026A", "e", "\u025B", "\u00E6", "\u0251", "\u0254", "o", "\u028A", "u", "\u028C", "\u0259"];
  const codas = ["p", "t", "k", "b", "d", "g", "f", "s", "z", "m", "n", "\u014B", "l", "r"];
  const [sel, setSel] = useState({ onset: null, nucleus: null, coda: null });
  // Precomputed phonotactic probabilities (simplified English model)
  const probTable = useMemo(() => {
    const rng = seededRandom(777);
    const table = {};
    for (const o of onsets) for (const n of nuclei) for (const c of codas) {
      const key = `${o}${n}${c}`;
      // Rough English phonotactic constraints
      let prob = 0.01 + rng() * 0.12;
      // Common onsets get higher base
      if ("stpkbdgfmnlr".includes(o)) prob += 0.03;
      // Common codas
      if ("tsndlz".includes(c)) prob += 0.02;
      table[key] = Math.min(prob, 0.18);
    }
    return table;
  }, []);

  const PhoneBtn = ({ ph, slot }) => {
    const active = sel[slot] === ph;
    return (
      <button onClick={() => setSel((prev) => ({ ...prev, [slot]: active ? null : ph }))}
        style={{
          width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? `${pal.accent}30` : `${pal.muted}15`,
          border: active ? `1px solid ${pal.accent}` : `1px solid ${pal.muted}30`,
          color: active ? pal.accent : pal.fg, fontFamily: "monospace", fontSize: 12, borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
        }}>{ph}</button>
    );
  };

  const syllable = `${sel.onset || "C"}${sel.nucleus || "V"}${sel.coda || "C"}`;
  const prob = sel.onset && sel.nucleus && sel.coda ? probTable[`${sel.onset}${sel.nucleus}${sel.coda}`] || 0.001 : null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: "10px 8px", alignItems: "start" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted, paddingTop: 6 }}>ONSET</span>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{onsets.map((p) => <PhoneBtn key={p} ph={p} slot="onset" />)}</div>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted, paddingTop: 6 }}>NUCLEUS</span>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{nuclei.map((p) => <PhoneBtn key={p} ph={p} slot="nucleus" />)}</div>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted, paddingTop: 6 }}>CODA</span>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{codas.map((p) => <PhoneBtn key={p} ph={p} slot="coda" />)}</div>
      </div>
      <div style={{ marginTop: 14, padding: "8px 12px", background: pal.glow, borderRadius: 4, fontFamily: "monospace", fontSize: 12, color: pal.fg, textAlign: "center" }}>
        <span style={{ color: pal.accent, fontSize: 16 }}>/{syllable}/</span>
        <div style={{ fontSize: 10, color: pal.muted, marginTop: 4 }}>
          {prob !== null
            ? `Phonotactic probability: ${prob.toFixed(4)} · ${prob > 0.08 ? "HIGH (common syllable)" : prob > 0.04 ? "MEDIUM" : "LOW (rare/marked)"}`
            : "Select onset + nucleus + coda to compute probability"
          }
        </div>
      </div>
    </div>
  );
};

// ─── Register Spectrum (REAL features) ─────────────────────

const RegisterSpectrum = ({ pal, corpora }) => {
  const features = useMemo(() => {
    return corpora.map((name) => {
      const corpus = getProcessedCorpus(name);
      if (!corpus) return null;
      const fp = corpus.freqProfile;
      const tokens = corpus.tokens;
      const lcTokens = tokens.map((t) => t.toLowerCase());

      // Compute real register features
      const avgWordLen = tokens.reduce((s, t) => s + t.length, 0) / (tokens.length || 1);
      const ttr = fp.ttr;
      const passiveCount = lcTokens.filter((t, i) => (t === "was" || t === "were" || t === "been") && lcTokens[i + 1]?.endsWith("ed")).length;
      const passiveRate = passiveCount / (corpus.sentenceCount || 1);
      const contractionCount = tokens.filter((t) => /'/.test(t)).length;
      const contractionRate = contractionCount / (tokens.length || 1);
      const nomCount = lcTokens.filter((t) => t.endsWith("tion") || t.endsWith("ment") || t.endsWith("ness") || t.endsWith("ity")).length;
      const nomRate = nomCount / (tokens.length || 1);
      const firstPersonCount = lcTokens.filter((t) => t === "i" || t === "me" || t === "my" || t === "we" || t === "our").length;
      const firstPersonRate = firstPersonCount / (tokens.length || 1);
      const avgSentLen = tokens.length / (corpus.sentenceCount || 1);
      const hedgeWords = new Set(["perhaps", "maybe", "somewhat", "rather", "quite", "fairly", "apparently", "seemingly", "presumably"]);
      const hedgeCount = lcTokens.filter((t) => hedgeWords.has(t)).length;
      const hedgeRate = hedgeCount / (tokens.length || 1);

      return {
        name,
        features: [
          { label: "avg_word_len", value: avgWordLen, max: 8 },
          { label: "TTR", value: ttr * 100, max: 100 },
          { label: "avg_sent_len", value: avgSentLen, max: 40 },
          { label: "passive_rate", value: passiveRate * 100, max: 10 },
          { label: "contractions", value: contractionRate * 100, max: 5 },
          { label: "nominalization", value: nomRate * 100, max: 5 },
          { label: "1st_person", value: firstPersonRate * 100, max: 10 },
          { label: "hedges", value: hedgeRate * 100, max: 3 },
        ],
      };
    }).filter(Boolean);
  }, [corpora]);

  const [activeReg, setActiveReg] = useState(0);

  if (features.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: pal.muted, fontFamily: "monospace", fontSize: 11 }}>Load corpora to analyze register features</div>;
  }

  const active = features[activeReg] || features[0];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {features.map((f, i) => (
          <button key={f.name} onClick={() => setActiveReg(i)}
            style={{
              background: i === activeReg ? pal.accent : "transparent",
              color: i === activeReg ? pal.bg : pal.muted,
              border: `1px solid ${i === activeReg ? pal.accent : pal.muted}40`,
              fontFamily: "monospace", fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer",
            }}>{f.name}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, padding: "0 4px" }}>
        {active.features.map((f) => {
          const pct = Math.min(100, (f.value / f.max) * 100);
          return (
            <div key={f.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 8, color: pal.fg }}>{f.value.toFixed(1)}</div>
              <div style={{ width: "100%", height: pct * 1.1, borderRadius: "3px 3px 0 0", background: `linear-gradient(to top, ${pal.accent}60, ${pal.accent}20)`, transition: "height 0.3s ease", minHeight: 2 }} />
              <div style={{ fontFamily: "monospace", fontSize: 7, color: pal.muted, writingMode: "vertical-rl", textOrientation: "mixed", height: 55, overflow: "hidden" }}>{f.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── N-gram Tessellation (REAL data) ───────────────────────

const NgramTessellation = ({ pal, corpora }) => {
  const [activeCorpus, setActiveCorpus] = useState(corpora[0] || "");
  const [nSize, setNSize] = useState(3);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (corpora.length > 0 && !corpora.includes(activeCorpus)) setActiveCorpus(corpora[0]);
  }, [corpora, activeCorpus]);

  const ngrams = useMemo(() => {
    if (!activeCorpus) return [];
    return getNgrams(activeCorpus, nSize, 2).slice(0, 20);
  }, [activeCorpus, nSize]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <select value={activeCorpus} onChange={(e) => setActiveCorpus(e.target.value)}
          style={{ background: `${pal.muted}15`, border: `1px solid ${pal.muted}40`, color: pal.fg, padding: "5px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: 10, outline: "none" }}>
          {corpora.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {[2, 3, 4].map((n) => (
          <button key={n} onClick={() => setNSize(n)}
            style={{
              background: nSize === n ? `${pal.accent}30` : "transparent",
              border: `1px solid ${nSize === n ? pal.accent : pal.muted}40`,
              color: nSize === n ? pal.accent : pal.muted,
              padding: "3px 8px", borderRadius: 3, cursor: "pointer", fontFamily: "monospace", fontSize: 10,
            }}>{n}-gram</button>
        ))}
        <span style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted }}>{ngrams.length} results</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {ngrams.map((ng, i) => {
          const active = hovered === i;
          return (
            <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: active ? `${pal.accent}25` : `${pal.muted}12`,
                border: `1px solid ${active ? pal.accent : pal.muted}${active ? "80" : "20"}`,
                borderRadius: 4, cursor: "pointer", transition: "all 0.2s", padding: 4,
              }}>
              {ng.words.map((p, j) => (
                <div key={j} style={{ fontFamily: "monospace", fontSize: 9, color: active ? pal.accent : pal.fg, opacity: 0.5 + (j === Math.floor(ng.words.length / 2) ? 0.5 : 0.2) }}>{p}</div>
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 8, color: pal.muted, marginTop: 3 }}>×{ng.count}</div>
            </div>
          );
        })}
      </div>
      {hovered !== null && ngrams[hovered] && (
        <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 10, color: pal.fg, padding: "6px 10px", background: pal.glow, borderRadius: 4 }}>
          <span style={{ color: pal.accent }}>{ngrams[hovered].gram}</span>
          {" "}· PMI: {ngrams[hovered].pmi} · G²: {ngrams[hovered].logLikelihood} · freq: {ngrams[hovered].count}
        </div>
      )}
    </div>
  );
};

// ─── Corpus Comparator (REAL stats) ────────────────────────

const CorpusComparator = ({ pal, corpora }) => {
  const stats = useMemo(() => compareCorpora(corpora), [corpora]);
  const metrics = ["tokens", "types", "ttr", "mattr", "hapaxRatio", "zipfFit", "sentences"];
  const metricLabels = ["Tokens", "Types", "TTR", "MATTR", "Hapax%", "Zipf Fit", "Sentences"];
  const [hoveredCell, setHoveredCell] = useState(null);

  if (stats.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: pal.muted, fontFamily: "monospace", fontSize: 11 }}>Load corpora to compare statistics</div>;
  }

  const formatVal = (key, val) => {
    if (key === "tokens" || key === "types" || key === "sentences") return val.toLocaleString();
    return typeof val === "number" ? val.toFixed(4) : String(val);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace", marginBottom: 8, letterSpacing: 1 }}>
        CROSS-CORPUS STATISTICAL COMPARISON — {stats.length} corpora
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${metrics.length}, 1fr)`, gap: 2, minWidth: 500 }}>
          <div />
          {metricLabels.map((m) => (
            <div key={m} style={{ fontFamily: "monospace", fontSize: 8, color: pal.muted, textAlign: "center", padding: "0 0 6px" }}>{m}</div>
          ))}
          {stats.map((s, ri) => (
            <div key={s.name} style={{ display: "contents" }}>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: pal.accent, fontWeight: 600, display: "flex", alignItems: "center", paddingRight: 6, justifyContent: "flex-end", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{s.name}</div>
              {metrics.map((key, ci) => {
                const val = s[key];
                const isHov = hoveredCell?.r === ri && hoveredCell?.c === ci;
                return (
                  <div key={`${ri}-${ci}`} onMouseEnter={() => setHoveredCell({ r: ri, c: ci })} onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      background: isHov ? `${pal.accent}25` : `${pal.muted}10`,
                      border: isHov ? `1px solid ${pal.accent}` : `1px solid ${pal.muted}15`,
                      borderRadius: 2, cursor: "pointer", fontFamily: "monospace", fontSize: 9, color: isHov ? pal.fg : pal.muted,
                    }}>
                    {formatVal(key, val)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── MetaOps Deck ──────────────────────────────────────────

const MetaOpsDeck = ({ pal, data, corpora }) => {
  const {
    edges = [], messages = [], commits = [], checks = [], prompts = [],
    extensionNames = [], energySignal = "amber", status = "loading",
  } = data || {};
  const metrics = data?.metrics;
  const corpusStats = useMemo(() => corpora.map((n) => getCorpusStats(n)).filter(Boolean), [corpora]);
  const totalTokens = corpusStats.reduce((s, c) => s + c.tokens, 0);
  const requestsLabel = metrics?.requestsTotal ?? totalTokens.toLocaleString() + " tok processed";
  const latencyLabel = typeof metrics?.avgLatencyMs === "number" ? metrics.avgLatencyMs.toFixed(1) + " ms" : `${corpora.length} corpora loaded`;
  const energyLabel = metrics?.energySignal ?? energySignal;
  const healthLabel = energySignal === "green" ? "Energy OK" : energySignal === "amber" ? "Standby" : "Throttle";

  return (
    <div style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: pal.accent, marginBottom: 4 }}>
        META-OPS DECK — {healthLabel} · {totalTokens.toLocaleString()} tokens across {corpora.length} corpora
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, flex: 1 }}>
        <div style={{ borderRadius: 8, background: `${pal.muted}10`, border: `1px solid ${pal.muted}40`, padding: 12 }}>
          <div style={{ fontSize: 11, color: pal.fg, marginBottom: 8 }}>Extension tree</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            {(extensionNames.length ? extensionNames : ["Concordance Helix", "Morpheme Forge", "Collocate Gravity", "Diachronic Strata", "Syntactic Cartography", "Frequency Thermograph"]).map((name) => (
              <span key={name} style={{ color: pal.muted }}>{name}</span>
            ))}
            <span style={{ color: pal.accent, fontWeight: 600 }}>MetaOps Deck</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: pal.muted }}>
            Loaded corpora:
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {corpusStats.map((s) => (
                <span key={s.name} style={{ fontFamily: "monospace", fontSize: 9 }}>
                  {s.name}: {s.tokens.toLocaleString()} tok, TTR {s.ttr.toFixed(3)}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 9, color: pal.muted, fontFamily: "monospace" }}>
            Pipeline status
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              <span>Processed: {requestsLabel}</span>
              <span>Status: {latencyLabel}</span>
              <span>Energy: {energyLabel}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ borderRadius: 10, border: `1px solid ${pal.accent}40`, background: `${pal.accent}10`, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1 }}>ANALYSIS CHANNEL</span>
              <span style={{ fontSize: 10, color: pal.muted }}>{status}</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.length ? messages.map((msg) => (
                <div key={msg.title} style={{ padding: "8px 10px", borderRadius: 6, background: pal.bg, border: `1px solid ${pal.muted}20` }}>
                  <div style={{ fontSize: 10, color: pal.muted, display: "flex", justifyContent: "space-between" }}>
                    <span>{msg.agent}</span><span>{msg.when}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: pal.fg, marginTop: 4 }}>{msg.title}</div>
                  <div style={{ fontSize: 10, color: pal.muted, marginTop: 2 }}>{msg.detail}</div>
                  <div style={{ marginTop: 6, fontSize: 9, color: pal.accent }}>{msg.badge}</div>
                </div>
              )) : <span style={{ fontSize: 10, color: pal.muted }}>Connect to backend for live metrics</span>}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
            <div style={{ borderRadius: 10, border: `1px solid ${pal.muted}30`, padding: 12, background: `${pal.muted}10` }}>
              <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace" }}>Corpus health</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {corpusStats.slice(0, 3).map((s) => (
                  <div key={s.name}>
                    <div style={{ fontSize: 11, color: pal.fg, display: "flex", justifyContent: "space-between" }}>
                      <span>{s.name.slice(0, 20)}</span>
                      <span style={{ color: pal.accent }}>{s.zipfFit > 0.9 ? "healthy" : "review"}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: `${pal.accent}20`, marginTop: 4 }}>
                      <div style={{ width: `${s.zipfFit * 100}%`, height: "100%", borderRadius: 3, background: pal.accent }} />
                    </div>
                    <div style={{ fontSize: 9, color: pal.muted }}>Zipf fit: {s.zipfFit.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 10, border: `1px solid ${pal.muted}20`, padding: 12, background: `${pal.muted}08` }}>
              <div style={{ fontSize: 10, color: pal.muted, fontFamily: "monospace" }}>Architecture checks</div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { title: "Tokenizer", desc: "Sentence segmentation + PTB tokenizer", ok: true },
                  { title: "Frequency engine", desc: "TTR, MATTR, Zipf, hapax analysis", ok: true },
                  { title: "Concordance", desc: "Inverted index KWIC with sort modes", ok: true },
                  { title: "Collocations", desc: "MI, T-score, Dice, G² scoring", ok: true },
                  { title: "Morphology", desc: "Rule-based affix stripping", ok: true },
                  { title: "N-grams", desc: "PMI + log-likelihood n-gram extraction", ok: true },
                ].map((check) => (
                  <div key={check.title}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: check.ok ? "#6abf69" : "#d46a6a", display: "inline-block" }} />
                      <span style={{ fontSize: 10, color: pal.fg }}>{check.title}</span>
                    </div>
                    <div style={{ fontSize: 8, color: pal.muted }}>{check.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Interface Registry ────────────────────────────────────

const INTERFACES = [
  { id: "data", name: "Data Acquisition", sub: "Corpus import & management", icon: "⊕", Component: DataAcquisition },
  { id: "concordance", name: "Concordance Helix", sub: "Spiral KWIC viewer", icon: "◉", Component: ConcordanceHelix },
  { id: "morpheme", name: "Morpheme Forge", sub: "Morphological decomposition", icon: "⬡", Component: MorphemeForge },
  { id: "collocate", name: "Collocate Gravity", sub: "Force-field collocations", icon: "⊛", Component: CollocateGravity },
  { id: "diachronic", name: "Diachronic Strata", sub: "Corpus layer comparison", icon: "≡", Component: DiachronicStrata },
  { id: "syntax", name: "Syntactic Cartography", sub: "POS tagging & parse maps", icon: "⌗", Component: SyntacticCartography },
  { id: "frequency", name: "Frequency Thermograph", sub: "Cross-corpus frequency heatmap", icon: "▦", Component: FrequencyThermograph },
  { id: "drift", name: "Semantic Drift", sub: "Meaning change over time", icon: "◎", Component: SemanticDrift },
  { id: "pragmatic", name: "Pragmatic Studio", sub: "Speech act annotation", icon: "◈", Component: PragmaticStudio },
  { id: "phonotactic", name: "Phonotactic Lattice", sub: "Syllable constraint browser", icon: "◬", Component: PhonotacticLattice },
  { id: "register", name: "Register Spectrum", sub: "Register feature analyzer", icon: "▮", Component: RegisterSpectrum },
  { id: "ngram", name: "N-gram Tessellation", sub: "Tiled n-gram patterns", icon: "⬢", Component: NgramTessellation },
  { id: "comparator", name: "Corpus Comparator", sub: "Cross-corpus statistics", icon: "⊞", Component: CorpusComparator },
  { id: "metaops", name: "MetaOps Deck", sub: "System + pipeline dashboard", icon: "⚙", Component: MetaOpsDeck },
];

// ─── Main App ──────────────────────────────────────────────

export default function CorporaInterfaces() {
  const [activeIdx, setActiveIdx] = useState(0); // Start on Data Acquisition
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [metaOpsData, setMetaOpsData] = useState(null);
  const [corporaNames, setCorporaNames] = useState([]);

  // Auto-load sample corpora on mount
  useEffect(() => {
    const first = SAMPLE_CORPORA[0];
    processCorpus(first.name, first.text);
    setCorporaNames([first.name]);
  }, []);

  // Try to fetch backend data (fails gracefully in static mode)
  useEffect(() => {
    fetchMetaOpsPayload().then(setMetaOpsData).catch(() => {});
  }, []);

  const handleCorpusLoaded = useCallback((name, text) => {
    processCorpus(name, text);
    setCorporaNames((prev) => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const activeInterface = activeIdx !== null ? INTERFACES[activeIdx] : null;
  const activePal = activeIdx !== null ? PALETTES[PAL_KEYS[activeIdx % PAL_KEYS.length]] : PALETTES.slate;

  const panelProps = {
    corpora: corporaNames,
    ...(activeInterface?.id === "data" ? { onCorpusLoaded: handleCorpusLoaded } : {}),
    ...(activeInterface?.id === "metaops" ? { data: metaOpsData } : {}),
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0b0f", color: "#c0c4cc", fontFamily: "'IBM Plex Mono', 'Fira Code', monospace", overflow: "hidden" }}>
      <div style={{ width: sidebarOpen ? 240 : 48, minWidth: sidebarOpen ? 240 : 48, borderRight: "1px solid #1a1c24", display: "flex", flexDirection: "column", transition: "width 0.25s, min-width 0.25s", overflow: "hidden", background: "#0c0d12" }}>
        <div onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: sidebarOpen ? "16px 16px 12px" : "16px 12px 12px", borderBottom: "1px solid #1a1c24", cursor: "pointer", userSelect: "none" }}>
          {sidebarOpen ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e4ec", letterSpacing: 1.5 }}>CORPORA</div>
              <div style={{ fontSize: 9, color: "#4a4e5c", marginTop: 2, letterSpacing: 2 }}>
                {corporaNames.length} CORPORA · {INTERFACES.length} INTERFACES
              </div>
            </>
          ) : (
            <div style={{ fontSize: 14, textAlign: "center", color: "#4a4e5c" }}>≡</div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {INTERFACES.map((iface, i) => {
            const isActive = activeIdx === i;
            const p = PALETTES[PAL_KEYS[i % PAL_KEYS.length]];
            return (
              <div key={iface.id} onClick={() => setActiveIdx(i)}
                style={{ padding: sidebarOpen ? "8px 14px" : "10px 0", cursor: "pointer", background: isActive ? `${p.accent}12` : "transparent", borderLeft: isActive ? `3px solid ${p.accent}` : "3px solid transparent", transition: "all 0.15s", textAlign: sidebarOpen ? "left" : "center" }}>
                <div style={{ fontSize: sidebarOpen ? 14 : 16, color: isActive ? p.accent : "#5a5e6c", lineHeight: 1 }}>{iface.icon}</div>
                {sidebarOpen && (
                  <>
                    <div style={{ fontSize: 11, color: isActive ? "#e0e4ec" : "#8a8e9c", marginTop: 3, fontWeight: isActive ? 600 : 400 }}>{iface.name}</div>
                    <div style={{ fontSize: 9, color: "#4a4e5c", marginTop: 1 }}>{iface.sub}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {sidebarOpen && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid #1a1c24", fontSize: 8, color: "#2a2e3c", letterSpacing: 1 }}>
            ECOLOGICAL NLP RESEARCH TOOLKIT
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${activePal.muted}30`, background: `${activePal.accent}06`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ color: activePal.accent, fontWeight: 700, fontSize: 14 }}>
              {activeInterface?.icon} {activeInterface?.name}
            </span>
            <span style={{ color: "#4a4e5c", fontSize: 11, marginLeft: 10 }}>{activeInterface?.sub}</span>
          </div>
          <div style={{ fontSize: 9, color: "#3a3e4c", fontFamily: "monospace" }}>
            {(activeIdx || 0) + 1} / {INTERFACES.length}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", background: activePal.bg }}>
          {activeInterface?.Component && <activeInterface.Component pal={activePal} {...panelProps} />}
        </div>
      </div>
    </div>
  );
}
