const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const META_OPS_PAYLOAD = {
  edges: [
    "LLM → Reasoning Loop",
    "Tool Call Circuit",
    "Ontological Prism Layer",
    "Meta-Abstraction Filter",
    "Subagent Feedback Bus",
  ],
  messages: [
    {
      agent: "Expedite",
      title: "Roadmap pulse",
      detail: "Healthy commits + tests are shipping ahead of the Vision S print.",
      when: "02:12",
      badge: "Committed",
    },
    {
      agent: "Guardian",
      title: "Architecture sanity check",
      detail: "Ontology prisming still maps cleanly to the layered abstractions.",
      when: "02:09",
      badge: "Aligned",
    },
    {
      agent: "Navigator",
      title: "LLM / tool loop",
      detail: "Inference cycles are hitting 8 edges with 92% success.",
      when: "01:58",
      badge: "Stable",
    },
  ],
  commits: [
    { branch: "main", status: "healthy", progress: 78, label: "Release cadence" },
    { branch: "metaops", status: "monitoring", progress: 42, label: "Roadmap stretch" },
    { branch: "docs", status: "review", progress: 63, label: "Architecture living doc" },
  ],
  checks: [
    { title: "Roadmap tractability", desc: "Milestones align with current compute / steward budgets.", ok: true },
    { title: "Architecture coherence", desc: "Layers still reflect corpus stewardship → governance.", ok: true },
    { title: "High-fidelity requests", desc: "Adaptive precision toggles have guardrails.", ok: false },
  ],
  prompts: [
    { name: "Design System Guardian", prompt: "Ensure every interface mirrors the ontology prism.", focus: "Consistency" },
    { name: "Commit Health Coach", prompt: "Highlight roadblocks and get commits green.", focus: "Progress" },
    { name: "MetaOps Conductor", prompt: "Keep the CTO channel grounded in actionable insights.", focus: "Clarity" },
  ],
  extensionNames: ["Concordance Helix", "Morpheme Forge", "Collocate Gravity", "Diachronic Strata", "Syntactic Cartography", "Frequency Thermograph"],
  energySignal: "green",
};

export const fetchConcordanceLines = async () => {
  await delay(250);
  return { keyword: "language", lines: CONCORDANCE_LINES };
};

export const fetchMetaOpsPayload = async () => {
  await delay(300);
  return {
    ...META_OPS_PAYLOAD,
    status: "live",
    cacheStatus: "fresh",
  };
};
