import { useMemo, useState } from "react";

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

const CONCORDANCE_LINES = [
  { left: "the historical study of", kw: "language", right: "change reveals patterns" },
  { left: "a formal model of", kw: "language", right: "structure was proposed" },
  { left: "children acquire their first", kw: "language", right: "through social interaction" },
  { left: "the boundaries between", kw: "language", right: "and dialect are fluid" },
  { left: "computational approaches to", kw: "language", right: "processing have advanced" },
  { left: "signed and spoken", kw: "language", right: "share deep structural" },
  { left: "every natural human", kw: "language", right: "exhibits recursive syntax" },
  { left: "the politics of", kw: "language", right: "policy affects education" },
  { left: "contact between any two", kw: "language", right: "varieties produces creoles" },
  { left: "documentation of endangered", kw: "language", right: "families remains urgent" },
];

const MORPHEMES = [
  { word: "unhappiness", parts: [{ m: "un-", type: "prefix", gloss: "NEG" }, { m: "happy", type: "root", gloss: "glad" }, { m: "-ness", type: "suffix", gloss: "NOM" }] },
  { word: "reconstruction", parts: [{ m: "re-", type: "prefix", gloss: "again" }, { m: "con-", type: "prefix", gloss: "together" }, { m: "struct", type: "root", gloss: "build" }, { m: "-ion", type: "suffix", gloss: "NOM" }] },
  { word: "unbreakable", parts: [{ m: "un-", type: "prefix", gloss: "NEG" }, { m: "break", type: "root", gloss: "fracture" }, { m: "-able", type: "suffix", gloss: "ADJ.POT" }] },
  { word: "decentralization", parts: [{ m: "de-", type: "prefix", gloss: "reverse" }, { m: "centr", type: "root", gloss: "middle" }, { m: "-al", type: "suffix", gloss: "ADJ" }, { m: "-ize", type: "suffix", gloss: "VERB" }, { m: "-ation", type: "suffix", gloss: "NOM" }] },
  { word: "interconnected", parts: [{ m: "inter-", type: "prefix", gloss: "between" }, { m: "connect", type: "root", gloss: "join" }, { m: "-ed", type: "suffix", gloss: "PAST" }] },
];

const SPEECH_ACTS = ["assertive", "directive", "commissive", "expressive", "declarative"];
const REGISTERS = ["frozen", "formal", "consultative", "casual", "intimate"];
const NGRAM_DATA = ["the_of_the", "in_the_of", "to_the_and", "of_the_in", "and_the_to", "for_the_is", "is_a_the", "that_the_of", "on_the_in", "it_is_a"];

const ConcordanceHelix = ({ pal }) => {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 11, color: pal.muted, marginBottom: 12, fontFamily: "monospace", letterSpacing: 1 }}>
        KEYWORD: "language" · {CONCORDANCE_LINES.length} HITS · SORTED BY LEFT CONTEXT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {CONCORDANCE_LINES.map((line, i) => {
          const active = selected === i;
          const offset = Math.sin(i * 0.6) * 30;
          return (
            <div
              key={i}
              onClick={() => setSelected(active ? null : i)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 8,
                padding: "6px 10px",
                marginLeft: offset,
                background: active ? pal.glow : "transparent",
                borderLeft: active ? `2px solid ${pal.accent}` : "2px solid transparent",
                cursor: "pointer",
                borderRadius: 3,
                transition: "all 0.2s",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              <span style={{ textAlign: "right", color: pal.muted }}>{line.left}</span>
              <span style={{ color: pal.accent, fontWeight: 700 }}>{line.kw}</span>
              <span style={{ color: pal.fg }}>{line.right}</span>
            </div>
          );
        })}
      </div>
      {selected !== null && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: pal.glow,
            borderRadius: 6,
            fontFamily: "monospace",
            fontSize: 11,
            color: pal.fg,
            borderLeft: `3px solid ${pal.accent}`,
          }}
        >
          <div style={{ color: pal.accent, marginBottom: 4 }}>▸ CONTEXT EXPANSION — Line {selected + 1}</div>
          <div>
            Position: {(selected + 1) * 347} · Document: corpus_segment_{Math.floor(selected / 3) + 1}.txt
          </div>
          <div>Collocates (L3–R3): study, change, structure, model, patterns, processing</div>
        </div>
      )}
    </div>
  );
};

const MorphemeForge = ({ pal }) => {
  const [activeWord, setActiveWord] = useState(0);
  const [hoveredPart, setHoveredPart] = useState(null);
  const typeColors = { prefix: "#d4a042", root: pal.accent, suffix: "#6abf69" };
  const m = MORPHEMES[activeWord];
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {MORPHEMES.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveWord(i);
              setHoveredPart(null);
            }}
            style={{
              background: i === activeWord ? pal.accent : "transparent",
              color: i === activeWord ? pal.bg : pal.muted,
              border: `1px solid ${i === activeWord ? pal.accent : pal.muted}`,
              padding: "4px 10px",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            {item.word}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 2, marginBottom: 20, alignItems: "stretch" }}>
        {m.parts.map((part, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredPart(i)}
            onMouseLeave={() => setHoveredPart(null)}
            style={{
              flex: part.type === "root" ? 2 : 1,
              background: hoveredPart === i ? `${typeColors[part.type]}30` : `${typeColors[part.type]}15`,
              borderTop: `3px solid ${typeColors[part.type]}`,
              padding: "12px 10px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              borderRadius: "0 0 4px 4px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 18, color: typeColors[part.type], fontWeight: 700 }}>
              {part.m}
            </div>
            <div style={{ fontSize: 10, color: pal.muted, marginTop: 4, fontFamily: "monospace" }}>
              {part.type.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: pal.fg, marginTop: 2 }}>{part.gloss}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: pal.muted,
          padding: "8px 12px",
          background: `${pal.accent}08`,
          borderRadius: 4,
          border: `1px solid ${pal.muted}30`,
        }}
      >
        <span style={{ color: pal.accent }}>σ</span> {m.parts.length} morphemes
        · {m.parts.filter((p) => p.type === "prefix").length} prefixes
        · {m.parts.filter((p) => p.type === "root").length} roots
        · {m.parts.filter((p) => p.type === "suffix").length} suffixes
        · derivational depth: {m.parts.length - 1}
      </div>
    </div>
  );
};

const CollocateGravity = ({ pal }) => {
  const rng = seededRandom(42);
  const center = { word: "language", x: 180, y: 140 };
  const collocates = useMemo(
    () =>
      [
        "natural",
        "programming",
        "body",
        "sign",
        "foreign",
        "first",
        "spoken",
        "written",
        "formal",
        "everyday",
        "acquisition",
        "processing",
        "learning",
        "model",
        "change",
      ].map((w, i) => {
        const angle = (i / 15) * Math.PI * 2 + rng() * 0.3;
        const dist = 50 + rng() * 90;
        return {
          word: w,
          x: 180 + Math.cos(angle) * dist,
          y: 140 + Math.sin(angle) * dist,
          mi: (3 + rng() * 8).toFixed(2),
          freq: Math.floor(10 + rng() * 500),
        };
      }),
    []
  );
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <svg viewBox="0 0 360 280" style={{ width: "100%", maxHeight: 280 }}>
        {[80, 130, 180].map((r) => (
          <circle key={r} cx={180} cy={140} r={r} fill="none" stroke={pal.muted} strokeWidth={0.5} strokeDasharray="3,3" opacity={0.3} />
        ))}
        {collocates.map((c, i) => (
          <line
            key={`l${i}`}
            x1={center.x}
            y1={center.y}
            x2={c.x}
            y2={c.y}
            stroke={hovered === i ? pal.accent : pal.muted}
            strokeWidth={hovered === i ? 1.5 : 0.5}
            opacity={hovered === i ? 0.8 : 0.2}
          />
        ))}
        <circle cx={center.x} cy={center.y} r={20} fill={`${pal.accent}30`} stroke={pal.accent} strokeWidth={1.5} />
        <text x={center.x} y={center.y + 4} textAnchor="middle" fill={pal.accent} fontSize={10} fontFamily="monospace" fontWeight="700">
          {center.word}
        </text>
        {collocates.map((c, i) => (
          <g key={`n${i}`} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle
              cx={c.x}
              cy={c.y}
              r={Math.max(6, c.freq / 50)}
              fill={hovered === i ? `${pal.accent}40` : `${pal.muted}30`}
              stroke={hovered === i ? pal.accent : "transparent"}
              strokeWidth={1}
            />
            <text x={c.x} y={c.y + 3} textAnchor="middle" fill={hovered === i ? pal.fg : pal.muted} fontSize={8} fontFamily="monospace">
              {c.word}
            </text>
          </g>
        ))}
      </svg>
      {hovered !== null && (
        <div style={{ fontFamily: "monospace", fontSize: 11, color: pal.fg, padding: "6px 10px", background: pal.glow, borderRadius: 4, marginTop: 8 }}>
          <span style={{ color: pal.accent }}>"{collocates[hovered].word}"</span>
          {" "}— MI: {collocates[hovered].mi} · freq: {collocates[hovered].freq} · span: L5–R5
        </div>
      )}
    </div>
  );
};

const DiachronicStrata = ({ pal }) => {
  const periods = [
    { era: "Old English", range: "450–1100", tokens: "3.1M", color: "#8B6914" },
    { era: "Middle English", range: "1100–1500", tokens: "12.4M", color: "#A0522D" },
    { era: "Early Modern", range: "1500–1700", tokens: "48.2M", color: "#6B8E23" },
    { era: "Late Modern", range: "1700–1900", tokens: "210M", color: "#4682B4" },
    { era: "Contemporary", range: "1900–2000", tokens: "1.8B", color: "#7B68EE" },
    { era: "Digital Age", range: "2000–present", tokens: "14.2B", color: pal.accent },
  ];
  const [activeLayer, setActiveLayer] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {periods.map((p, i) => {
          const active = activeLayer === i;
          const h = active ? 52 : 36;
          return (
            <div
              key={i}
              onClick={() => setActiveLayer(active ? null : i)}
              style={{
                height: h,
                background: `linear-gradient(90deg, ${p.color}${active ? "50" : "20"} 0%, ${p.color}${active ? "30" : "08"} 100%)`,
                borderLeft: `4px solid ${p.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 14px",
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "0 3px 3px 0",
              }}
            >
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                <span style={{ color: p.color, fontWeight: 700 }}>{p.era}</span>
                <span style={{ color: pal.muted, marginLeft: 8, fontSize: 10 }}>{p.range}</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: pal.muted }}>{p.tokens} tokens</div>
            </div>
          );
        })}
      </div>
      {activeLayer !== null && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderLeft: `3px solid ${periods[activeLayer].color}`,
            background: `${periods[activeLayer].color}10`,
            borderRadius: "0 4px 4px 0",
            fontFamily: "monospace",
            fontSize: 11,
            color: pal.fg,
          }}
        >
          <div style={{ color: periods[activeLayer].color, fontWeight: 700, marginBottom: 6 }}>
            ◆ {periods[activeLayer].era} Stratum
          </div>
          <div>Sources: manuscripts, printed texts, newspapers, web archives</div>
          <div>Genres: religious, legal, literary, scientific, correspondence</div>
          <div>Annotation: POS-tagged, lemmatized, normalized spelling</div>
        </div>
      )}
    </div>
  );
};

const SyntacticCartography = ({ pal }) => {
  const nodes = [
    { w: "The", pos: "DET", x: 20, y: 60, head: 2 },
    { w: "quick", pos: "ADJ", x: 70, y: 60, head: 2 },
    { w: "fox", pos: "NOUN", x: 125, y: 20, head: 3 },
    { w: "jumps", pos: "VERB", x: 195, y: 0, head: -1 },
    { w: "over", pos: "ADP", x: 260, y: 40, head: 3 },
    { w: "the", pos: "DET", x: 310, y: 70, head: 6 },
    { w: "lazy", pos: "ADJ", x: 340, y: 50, head: 6 },
    { w: "dog", pos: "NOUN", x: 378, y: 40, head: 4 },
  ];
  const depLabels = ["det", "amod", "nsubj", "ROOT", "case", "det", "amod", "obl"];
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <svg viewBox="-5 -15 410 110" style={{ width: "100%", maxHeight: 130 }}>
        {nodes.map((n, i) => {
          if (n.head < 0) return null;
          const parent = nodes[n.head];
          const mx = (n.x + parent.x) / 2;
          const my = Math.min(n.y, parent.y) - 15;
          return (
            <g key={`e${i}`}>
              <path
                d={`M${n.x},${n.y} Q${mx},${my} ${parent.x},${parent.y}`}
                fill="none"
                stroke={hovered === i ? pal.accent : pal.muted}
                strokeWidth={hovered === i ? 1.5 : 0.8}
              />
              <text x={mx} y={my - 2} textAnchor="middle" fill={pal.muted} fontSize={7} fontFamily="monospace">
                {depLabels[i]}
              </text>
            </g>
          );
        })}
        {nodes.map((n, i) => (
          <g key={`n${i}`} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <rect
              x={n.x - 18}
              y={n.y - 8}
              width={36}
              height={16}
              rx={3}
              fill={hovered === i ? `${pal.accent}30` : `${pal.muted}15`}
              stroke={hovered === i ? pal.accent : "transparent"}
              strokeWidth={1}
            />
            <text x={n.x} y={n.y + 3} textAnchor="middle" fill={hovered === i ? pal.accent : pal.fg} fontSize={9} fontFamily="monospace" fontWeight="600">
              {n.w}
            </text>
            <text x={n.x} y={n.y + 18} textAnchor="middle" fill={pal.muted} fontSize={7} fontFamily="monospace">
              {n.pos}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 10, fontFamily: "monospace", fontSize: 10, color: pal.muted }}>
        {["DET", "ADJ", "NOUN", "VERB", "ADP"].map((pos) => (
          <span key={pos}>◦ {pos}</span>
        ))}
      </div>
    </div>
  );
};

const FrequencyThermograph = ({ pal }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const rng = seededRandom(77);
  const genres = ["News", "Fiction", "Academic", "Spoken", "Web"];
  const words = ["language", "time", "people", "world", "system", "work", "data", "life", "way", "point"];
  const matrix = useMemo(() => words.map(() => genres.map(() => rng() * 100)), []);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${genres.length}, 1fr)`, gap: 2 }}>
        <div />
        {genres.map((g) => (
          <div key={g} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: pal.muted, padding: "0 0 6px" }}>
            {g}
          </div>
        ))}
        {words.map((w, ri) => (
          <div key={`row-${ri}`} style={{ display: "contents" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                color: pal.fg,
                display: "flex",
                alignItems: "center",
                paddingRight: 6,
                justifyContent: "flex-end",
              }}
            >
              {w}
            </div>
            {genres.map((_, ci) => {
              const val = matrix[ri][ci];
              const isHov = hoveredCell?.r === ri && hoveredCell?.c === ci;
              const intensity = val / 100;
              return (
                <div
                  key={`${ri}-${ci}`}
                  onMouseEnter={() => setHoveredCell({ r: ri, c: ci })}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    height: 24,
                    borderRadius: 2,
                    background: `rgba(${Math.floor(lerp(20, 212, intensity))}, ${Math.floor(
                      lerp(30, 160, Math.max(0, intensity - 0.5) * 2)
                    )}, ${Math.floor(lerp(80, 66, intensity))}, ${0.3 + intensity * 0.6})`,
                    border: isHov ? `1px solid ${pal.accent}` : "1px solid transparent",
                    cursor: "pointer",
                    transition: "border 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isHov && (
                    <span style={{ fontSize: 8, color: "#fff", fontFamily: "monospace" }}>{val.toFixed(0)}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12, alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: pal.muted }}>LOW</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div
            key={v}
            style={{
              width: 20,
              height: 8,
              borderRadius: 1,
              background: `rgba(${Math.floor(lerp(20, 212, v))}, ${Math.floor(
                lerp(30, 160, Math.max(0, v - 0.5) * 2)
              )}, ${Math.floor(lerp(80, 66, v))}, ${0.3 + v * 0.6})`,
            }}
          />
        ))}
        <span style={{ fontFamily: "monospace", fontSize: 9, color: pal.muted }}>HIGH</span>
      </div>
    </div>
  );
};

const SemanticDrift = ({ pal }) => {
  const word = "awful";
  const timeline = [
    { year: 1400, meaning: "awe-inspiring, full of awe", valence: 0.8 },
    { year: 1500, meaning: "commanding respect", valence: 0.7 },
    { year: 1600, meaning: "dreadful, fearsome", valence: 0.3 },
    { year: 1700, meaning: "exceedingly bad", valence: -0.3 },
    { year: 1800, meaning: "very bad, terrible", valence: -0.6 },
    { year: 1900, meaning: "extremely unpleasant", valence: -0.8 },
    { year: 2000, meaning: "terrible; also intensifier", valence: -0.7 },
  ];
  const [hovered, setHovered] = useState(null);
  const w = 340;
  const h = 120;
  const pad = 30;
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: pal.accent, marginBottom: 12 }}>◎ DRIFT TRACE: "{word}"</div>
      <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: "100%", maxHeight: 160 }}>
        <line x1={pad} y1={h / 2 + 5} x2={w - 10} y2={h / 2 + 5} stroke={pal.muted} strokeWidth={0.5} strokeDasharray="2,3" />
        <text x={pad - 4} y={15} fill={pal.muted} fontSize={7} fontFamily="monospace" textAnchor="end">
          +
        </text>
        <text x={pad - 4} y={h} fill={pal.muted} fontSize={7} fontFamily="monospace" textAnchor="end">
          −
        </text>
        {timeline.map((t, i) => {
          const x = pad + (i / (timeline.length - 1)) * (w - pad - 15);
          const y = 10 + ((1 - (t.valence + 1) / 2) * (h - 20));
          const next = timeline[i + 1];
          const nx = next ? pad + ((i + 1) / (timeline.length - 1)) * (w - pad - 15) : 0;
          const ny = next ? 10 + ((1 - (next.valence + 1) / 2) * (h - 20)) : 0;
          return (
            <g key={i}>
              {next && <line x1={x} y1={y} x2={nx} y2={ny} stroke={pal.accent} strokeWidth={1.5} opacity={0.5} />}
              <circle
                cx={x}
                cy={y}
                r={hovered === i ? 6 : 4}
                fill={t.valence > 0 ? "#6abf69" : "#d46a6a"}
                stroke={hovered === i ? pal.fg : "transparent"}
                strokeWidth={1}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              />
              <text x={x} y={h + 16} textAnchor="middle" fill={pal.muted} fontSize={7} fontFamily="monospace">
                {t.year}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div style={{ fontFamily: "monospace", fontSize: 11, color: pal.fg, padding: "8px 10px", background: pal.glow, borderRadius: 4, marginTop: 6 }}>
          <span style={{ color: pal.accent }}>{timeline[hovered].year}:</span> "{timeline[hovered].meaning}"
          <span style={{ color: pal.muted }}> · valence: {timeline[hovered].valence > 0 ? "+" : ""}{timeline[hovered].valence}</span>
        </div>
      )}
    </div>
  );
};

const PragmaticStudio = ({ pal }) => {
  const utterances = [
    { speaker: "A", text: "Could you pass me the report?", act: "directive", force: 0.6 },
    { speaker: "B", text: "Sure, here it is.", act: "commissive", force: 0.3 },
    { speaker: "A", text: "This looks really thorough.", act: "expressive", force: 0.5 },
    { speaker: "B", text: "The data shows a 12% increase.", act: "assertive", force: 0.8 },
    { speaker: "A", text: "Let's present this at the meeting.", act: "directive", force: 0.7 },
    { speaker: "B", text: "I agree, it's compelling.", act: "expressive", force: 0.4 },
  ];
  const actColors = { assertive: "#5b9bd5", directive: "#d4a042", commissive: "#6abf69", expressive: "#d46a8e", declarative: "#8b6abf" };
  const [selectedAct, setSelectedAct] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {SPEECH_ACTS.map((act) => (
          <button
            key={act}
            onClick={() => setSelectedAct(selectedAct === act ? null : act)}
            style={{
              background: selectedAct === act ? actColors[act] + "30" : "transparent",
              border: `1px solid ${actColors[act]}60`,
              color: actColors[act],
              fontFamily: "monospace",
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            {act}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {utterances.map((u, i) => {
          const dimmed = selectedAct && u.act !== selectedAct;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr 80px 40px",
                gap: 8,
                alignItems: "center",
                padding: "6px 10px",
                background: dimmed ? "transparent" : `${actColors[u.act]}08`,
                borderLeft: `3px solid ${actColors[u.act]}${dimmed ? "20" : "80"}`,
                borderRadius: "0 3px 3px 0",
                opacity: dimmed ? 0.35 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 11, color: pal.muted, fontWeight: 700 }}>{u.speaker}</span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: dimmed ? pal.muted : pal.fg }}>{u.text}</span>
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

const PhonotacticLattice = ({ pal }) => {
  const onsets = ["p", "t", "k", "b", "d", "g", "f", "s", "ʃ", "h", "m", "n", "l", "r", "w", "j"];
  const nuclei = ["i", "ɪ", "e", "ɛ", "æ", "ɑ", "ɔ", "o", "ʊ", "u", "ʌ", "ə"];
  const codas = ["p", "t", "k", "b", "d", "g", "f", "s", "z", "m", "n", "ŋ", "l", "r"];
  const [sel, setSel] = useState({ onset: null, nucleus: null, coda: null });
  const PhoneBtn = ({ ph, slot }) => {
    const active = sel[slot] === ph;
    return (
      <button
        onClick={() => setSel((prev) => ({ ...prev, [slot]: active ? null : ph }))}
        style={{
          width: 26,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? `${pal.accent}30` : `${pal.muted}15`,
          border: active ? `1px solid ${pal.accent}` : `1px solid ${pal.muted}30`,
          color: active ? pal.accent : pal.fg,
          fontFamily: "monospace",
          fontSize: 12,
          borderRadius: 3,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {ph}
      </button>
    );
  };
  const syllable = `${sel.onset || "C"}${sel.nucleus || "V"}${sel.coda || "C"}`;
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
      <div
        style={{
          marginTop: 14,
          padding: "8px 12px",
          background: pal.glow,
          borderRadius: 4,
          fontFamily: "monospace",
          fontSize: 12,
          color: pal.fg,
          textAlign: "center",
        }}
      >
        <span style={{ color: pal.accent, fontSize: 16 }}>/{syllable}/</span>
        <div style={{ fontSize: 10, color: pal.muted, marginTop: 4 }}>
          {sel.onset || sel.nucleus || sel.coda
            ? "Phonotactic probability: " + (0.02 + Math.random() * 0.15).toFixed(4)
            : "Select phonemes to build a syllable template"}
        </div>
      </div>
    </div>
  );
};

const RegisterSpectrum = ({ pal }) => {
  const rng = seededRandom(88);
  const features = ["avg_word_len", "type_token", "subord_clauses", "passives", "contractions", "hedges", "nominalization", "1st_person"];
  const registerData = useMemo(() => REGISTERS.map(() => features.map(() => rng() * 100)), []);
  const [activeReg, setActiveReg] = useState(0);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {REGISTERS.map((r, i) => (
          <button
            key={r}
            onClick={() => setActiveReg(i)}
            style={{
              background: i === activeReg ? pal.accent : "transparent",
              color: i === activeReg ? pal.bg : pal.muted,
              border: `1px solid ${i === activeReg ? pal.accent : pal.muted}40`,
              fontFamily: "monospace",
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            {r}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, padding: "0 4px" }}>
        {features.map((f, i) => {
          const val = registerData[activeReg][i];
          return (
            <div key={f} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: "100%",
                  height: val * 1.1,
                  borderRadius: "3px 3px 0 0",
                  background: `linear-gradient(to top, ${pal.accent}60, ${pal.accent}20)`,
                  transition: "height 0.3s ease",
                }}
              />
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 7,
                  color: pal.muted,
                  writingMode: "vertical-rl",
                  textOrientation: "mixed",
                  height: 60,
                  overflow: "hidden",
                }}
              >
                {f}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NgramTessellation = ({ pal }) => {
  const rng = seededRandom(99);
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {NGRAM_DATA.map((ng, i) => {
          const freq = Math.floor(500 + rng() * 9500);
          const parts = ng.split("_");
          const active = hovered === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                aspectRatio: "1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: active ? `${pal.accent}25` : `${pal.muted}12`,
                border: `1px solid ${active ? pal.accent : pal.muted}${active ? "80" : "20"}`,
                borderRadius: 4,
                cursor: "pointer",
                transition: "all 0.2s",
                padding: 4,
              }}
            >
              {parts.map((p, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: active ? pal.accent : pal.fg,
                    opacity: 0.5 + (j === 1 ? 0.5 : 0.2),
                  }}
                >
                  {p}
                </div>
              ))}
              <div style={{ fontFamily: "monospace", fontSize: 8, color: pal.muted, marginTop: 4 }}>{freq}</div>
            </div>
          );
        })}
      </div>
      {hovered !== null && (
        <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 11, color: pal.fg, padding: "6px 10px", background: pal.glow, borderRadius: 4 }}>
          Trigram: <span style={{ color: pal.accent }}>{NGRAM_DATA[hovered].replace(/_/g, " ")}</span>
          {" "}· PMI: {(1 + rng() * 5).toFixed(2)} · Δf/decade: {(rng() > 0.5 ? "+" : "−")}{(rng() * 15).toFixed(1)}%
        </div>
      )}
    </div>
  );
};

const CorpusComparator = ({ pal }) => {
  const corpora = ["BNC", "COCA", "GloWbE", "iWeb", "NOW"];
  const metrics = ["tokens", "types", "TTR", "hapax%", "avg_sent_len"];
  const rng = seededRandom(123);
  const data = useMemo(() => corpora.map(() => metrics.map(() => rng())), []);
  const [hoveredCell, setHoveredCell] = useState(null);
  const formatVal = (v, mi) => {
    if (mi === 0) return `${(v * 500).toFixed(0)}M`;
    if (mi === 1) return `${(v * 200).toFixed(0)}K`;
    if (mi === 2) return (v * 0.08 + 0.01).toFixed(3);
    if (mi === 3) return `${(v * 50 + 20).toFixed(0)}%`;
    return (v * 20 + 8).toFixed(1);
  };
  return (
    <div style={{ padding: 20 }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `70px repeat(${metrics.length}, 1fr)`, gap: 2, minWidth: 360 }}>
          <div />
          {metrics.map((m) => (
            <div key={m} style={{ fontFamily: "monospace", fontSize: 8, color: pal.muted, textAlign: "center", padding: "0 0 6px" }}>
              {m}
            </div>
          ))}
          {corpora.map((c, ri) => (
            <div key={c} style={{ display: "contents" }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: pal.accent,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  paddingRight: 6,
                  justifyContent: "flex-end",
                }}
              >
                {c}
              </div>
              {metrics.map((_, ci) => {
                const v = data[ri][ci];
                const isHov = hoveredCell?.r === ri && hoveredCell?.c === ci;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    onMouseEnter={() => setHoveredCell({ r: ri, c: ci })}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isHov ? `${pal.accent}25` : `${pal.accent}${Math.floor(v * 15).toString(16).padStart(2, "0")}`,
                      border: isHov ? `1px solid ${pal.accent}` : `1px solid ${pal.muted}15`,
                      borderRadius: 2,
                      cursor: "pointer",
                      fontFamily: "monospace",
                      fontSize: 9,
                      color: isHov ? pal.fg : pal.muted,
                      transition: "all 0.15s",
                    }}
                  >
                    {isHov && formatVal(v, ci)}
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

const INTERFACES = [
  { id: "concordance", name: "Concordance Helix", sub: "Spiral KWIC viewer", icon: "◉", Component: ConcordanceHelix },
  { id: "morpheme", name: "Morpheme Forge", sub: "Morphological decomposition", icon: "⬡", Component: MorphemeForge },
  { id: "collocate", name: "Collocate Gravity", sub: "Force-field collocations", icon: "⊛", Component: CollocateGravity },
  { id: "diachronic", name: "Diachronic Strata", sub: "Historical corpus layers", icon: "≡", Component: DiachronicStrata },
  { id: "syntax", name: "Syntactic Cartography", sub: "Dependency parse maps", icon: "⌗", Component: SyntacticCartography },
  { id: "frequency", name: "Frequency Thermograph", sub: "Genre × frequency heatmap", icon: "▦", Component: FrequencyThermograph },
  { id: "drift", name: "Semantic Drift", sub: "Meaning change over time", icon: "◎", Component: SemanticDrift },
  { id: "pragmatic", name: "Pragmatic Studio", sub: "Speech act annotation", icon: "◈", Component: PragmaticStudio },
  { id: "phonotactic", name: "Phonotactic Lattice", sub: "Syllable constraint browser", icon: "◬", Component: PhonotacticLattice },
  { id: "register", name: "Register Spectrum", sub: "Register feature analyzer", icon: "▮", Component: RegisterSpectrum },
  { id: "ngram", name: "N-gram Tessellation", sub: "Tiled n-gram patterns", icon: "⬢", Component: NgramTessellation },
  { id: "comparator", name: "Corpus Comparator", sub: "Cross-corpus statistics", icon: "⊞", Component: CorpusComparator },
];

export default function CorporaInterfaces() {
  const [activeIdx, setActiveIdx] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ActiveComponent = activeIdx !== null ? INTERFACES[activeIdx].Component : null;
  const activePal = activeIdx !== null ? PALETTES[PAL_KEYS[activeIdx % PAL_KEYS.length]] : PALETTES.slate;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0a0b0f",
        color: "#c0c4cc",
        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: sidebarOpen ? 240 : 48,
          minWidth: sidebarOpen ? 240 : 48,
          borderRight: "1px solid #1a1c24",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s, min-width 0.25s",
          overflow: "hidden",
          background: "#0c0d12",
        }}
      >
        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            padding: sidebarOpen ? "16px 16px 12px" : "16px 12px 12px",
            borderBottom: "1px solid #1a1c24",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {sidebarOpen ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e4ec", letterSpacing: 1.5 }}>CORPORA</div>
              <div style={{ fontSize: 9, color: "#4a4e5c", marginTop: 2, letterSpacing: 2 }}>12 RESEARCH INTERFACES</div>
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
              <div
                key={iface.id}
                onClick={() => setActiveIdx(isActive ? null : i)}
                style={{
                  padding: sidebarOpen ? "8px 14px" : "10px 0",
                  cursor: "pointer",
                  background: isActive ? `${p.accent}12` : "transparent",
                  borderLeft: isActive ? `3px solid ${p.accent}` : "3px solid transparent",
                  transition: "all 0.15s",
                  textAlign: sidebarOpen ? "left" : "center",
                }}
              >
                <div
                  style={{
                    fontSize: sidebarOpen ? 14 : 16,
                    color: isActive ? p.accent : "#5a5e6c",
                    lineHeight: 1,
                  }}
                >
                  {iface.icon}
                </div>
                {sidebarOpen && (
                  <>
                    <div
                      style={{
                        fontSize: 11,
                        color: isActive ? "#e0e4ec" : "#8a8e9c",
                        marginTop: 3,
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {iface.name}
                    </div>
                    <div style={{ fontSize: 9, color: "#4a4e5c", marginTop: 1 }}>{iface.sub}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {sidebarOpen && (
          <div style={{ padding: "10px 14px", borderTop: "1px solid #1a1c24", fontSize: 8, color: "#2a2e3c", letterSpacing: 1 }}>
            LINGUISTIC RESEARCH TOOLKIT
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeIdx !== null ? (
          <>
            <div
              style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${activePal.muted}30`,
                background: `${activePal.accent}06`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ color: activePal.accent, fontWeight: 700, fontSize: 14 }}>
                  {INTERFACES[activeIdx].icon} {INTERFACES[activeIdx].name}
                </span>
                <span style={{ color: "#4a4e5c", fontSize: 11, marginLeft: 10 }}>{INTERFACES[activeIdx].sub}</span>
              </div>
              <div style={{ fontSize: 9, color: "#3a3e4c", fontFamily: "monospace" }}>
                {activeIdx + 1} / {INTERFACES.length}
              </div>
            </div>
            <div style={{ flex: 1, overflow: "auto", background: activePal.bg }}>
              <ActiveComponent pal={activePal} />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 40, opacity: 0.1 }}>◎</div>
            <div style={{ fontSize: 13, color: "#3a3e4c", fontWeight: 600, letterSpacing: 2 }}>SELECT AN INTERFACE</div>
            <div style={{ fontSize: 10, color: "#2a2e3c", maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
              Twelve paradigms for corpus exploration — from concordance helices to phonotactic lattices.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16, maxWidth: 440 }}>
              {INTERFACES.map((iface, i) => {
                const p = PALETTES[PAL_KEYS[i % PAL_KEYS.length]];
                return (
                  <div
                    key={iface.id}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      padding: "14px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: `${p.accent}08`,
                      border: `1px solid ${p.accent}20`,
                      borderRadius: 6,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = p.accent + "60";
                      e.currentTarget.style.background = p.accent + "15";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = p.accent + "20";
                      e.currentTarget.style.background = p.accent + "08";
                    }}
                  >
                    <div style={{ fontSize: 18, color: p.accent, marginBottom: 6 }}>{iface.icon}</div>
                    <div style={{ fontSize: 9, color: "#8a8e9c", fontWeight: 500 }}>{iface.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
