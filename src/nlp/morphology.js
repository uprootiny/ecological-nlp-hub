// Rule-based morphological analyzer with affix stripping

const PREFIXES = [
  { form: "un", gloss: "NEG", category: "negation" },
  { form: "re", gloss: "again", category: "repetition" },
  { form: "pre", gloss: "before", category: "temporal" },
  { form: "post", gloss: "after", category: "temporal" },
  { form: "dis", gloss: "apart/NEG", category: "negation" },
  { form: "mis", gloss: "wrongly", category: "evaluative" },
  { form: "over", gloss: "excess", category: "degree" },
  { form: "under", gloss: "insufficient", category: "degree" },
  { form: "out", gloss: "surpass", category: "degree" },
  { form: "sub", gloss: "below", category: "spatial" },
  { form: "super", gloss: "above", category: "spatial" },
  { form: "inter", gloss: "between", category: "relational" },
  { form: "trans", gloss: "across", category: "spatial" },
  { form: "anti", gloss: "against", category: "opposition" },
  { form: "counter", gloss: "against", category: "opposition" },
  { form: "de", gloss: "reverse", category: "privative" },
  { form: "non", gloss: "not", category: "negation" },
  { form: "semi", gloss: "half", category: "degree" },
  { form: "co", gloss: "together", category: "relational" },
  { form: "micro", gloss: "small", category: "size" },
  { form: "macro", gloss: "large", category: "size" },
  { form: "multi", gloss: "many", category: "quantity" },
  { form: "mono", gloss: "one", category: "quantity" },
  { form: "bi", gloss: "two", category: "quantity" },
  { form: "tri", gloss: "three", category: "quantity" },
  { form: "poly", gloss: "many", category: "quantity" },
  { form: "auto", gloss: "self", category: "reflexive" },
  { form: "neo", gloss: "new", category: "temporal" },
  { form: "proto", gloss: "first", category: "temporal" },
  { form: "pseudo", gloss: "false", category: "evaluative" },
];

const SUFFIXES = [
  { form: "ness", gloss: "NOM (state)", pos: "N", fromPos: "ADJ" },
  { form: "ment", gloss: "NOM (result)", pos: "N", fromPos: "V" },
  { form: "tion", gloss: "NOM (process)", pos: "N", fromPos: "V" },
  { form: "sion", gloss: "NOM (process)", pos: "N", fromPos: "V" },
  { form: "ation", gloss: "NOM (process)", pos: "N", fromPos: "V" },
  { form: "ity", gloss: "NOM (quality)", pos: "N", fromPos: "ADJ" },
  { form: "ism", gloss: "NOM (doctrine)", pos: "N", fromPos: "N/ADJ" },
  { form: "ist", gloss: "AGENT", pos: "N", fromPos: "N/V" },
  { form: "er", gloss: "AGENT/COMP", pos: "N/ADJ", fromPos: "V/ADJ" },
  { form: "or", gloss: "AGENT", pos: "N", fromPos: "V" },
  { form: "able", gloss: "ADJ.POT", pos: "ADJ", fromPos: "V" },
  { form: "ible", gloss: "ADJ.POT", pos: "ADJ", fromPos: "V" },
  { form: "ful", gloss: "ADJ (full of)", pos: "ADJ", fromPos: "N" },
  { form: "less", gloss: "ADJ (without)", pos: "ADJ", fromPos: "N" },
  { form: "ous", gloss: "ADJ (having)", pos: "ADJ", fromPos: "N" },
  { form: "ive", gloss: "ADJ (tending)", pos: "ADJ", fromPos: "V" },
  { form: "al", gloss: "ADJ (relating)", pos: "ADJ", fromPos: "N" },
  { form: "ic", gloss: "ADJ (of)", pos: "ADJ", fromPos: "N" },
  { form: "ical", gloss: "ADJ (of)", pos: "ADJ", fromPos: "N" },
  { form: "ize", gloss: "VERB (make)", pos: "V", fromPos: "N/ADJ" },
  { form: "ise", gloss: "VERB (make)", pos: "V", fromPos: "N/ADJ" },
  { form: "ify", gloss: "VERB (make)", pos: "V", fromPos: "N/ADJ" },
  { form: "en", gloss: "VERB (make)", pos: "V", fromPos: "ADJ" },
  { form: "ate", gloss: "VERB (cause)", pos: "V", fromPos: "N/ADJ" },
  { form: "ly", gloss: "ADV", pos: "ADV", fromPos: "ADJ" },
  { form: "ward", gloss: "ADV (direction)", pos: "ADV", fromPos: "N" },
  { form: "wise", gloss: "ADV (manner)", pos: "ADV", fromPos: "N" },
  { form: "ing", gloss: "PROG/GER", pos: "V/N", fromPos: "V" },
  { form: "ed", gloss: "PAST/PTCP", pos: "V/ADJ", fromPos: "V" },
  { form: "s", gloss: "PL/3SG", pos: "N/V", fromPos: "N/V" },
  { form: "es", gloss: "PL/3SG", pos: "N/V", fromPos: "N/V" },
];

// Common roots (abbreviated set for client-side use)
const ROOTS = new Set([
  "act", "age", "art", "base", "bear", "beat", "bind", "bite", "blow", "break",
  "bring", "build", "burn", "buy", "call", "care", "carry", "cast", "catch",
  "change", "charge", "check", "claim", "class", "clear", "close", "code",
  "come", "connect", "count", "cover", "cross", "cut", "deal", "depend",
  "develop", "direct", "do", "draw", "drive", "drop", "eat", "effect",
  "end", "enter", "equal", "event", "face", "fact", "fall", "feel", "fight",
  "fill", "find", "fire", "fit", "flow", "fly", "follow", "force", "form",
  "found", "free", "front", "gain", "give", "go", "govern", "grade", "grand",
  "ground", "group", "grow", "guide", "hand", "hang", "happen", "happy",
  "head", "hear", "heart", "help", "hold", "home", "hope", "human", "idea",
  "interest", "issue", "join", "just", "keep", "kind", "king", "know",
  "land", "language", "large", "late", "lead", "learn", "leave", "level",
  "light", "like", "line", "link", "list", "live", "long", "look", "lose",
  "love", "make", "manage", "mark", "master", "match", "mean", "measure",
  "mind", "miss", "model", "move", "music", "name", "nation", "nature",
  "need", "note", "number", "open", "order", "organ", "own", "part",
  "pass", "pay", "people", "period", "person", "place", "plan", "plant",
  "play", "point", "politic", "port", "pose", "power", "press", "produce",
  "program", "project", "prove", "public", "pull", "purpose", "push",
  "put", "question", "quiet", "reach", "read", "real", "reason", "record",
  "reduce", "relate", "report", "rest", "result", "return", "right", "rise",
  "roll", "room", "rule", "run", "safe", "say", "school", "search", "sense",
  "serve", "set", "show", "side", "sign", "simple", "sit", "social", "solve",
  "sort", "sound", "speak", "stand", "start", "state", "step", "stop",
  "story", "struct", "study", "support", "sure", "system", "take", "talk",
  "teach", "tell", "tend", "test", "think", "time", "touch", "trade",
  "train", "treat", "turn", "type", "understand", "use", "value", "view",
  "visit", "voice", "walk", "want", "war", "watch", "water", "way",
  "will", "win", "word", "work", "world", "write", "young",
]);

export function analyzeMorphemes(word) {
  const lc = word.toLowerCase();
  if (lc.length < 3) return [{ m: word, type: "root", gloss: "base" }];

  const results = [];

  function strip(remaining, prefixParts, suffixParts, depth) {
    if (depth > 5) return;
    if (ROOTS.has(remaining) || (remaining.length >= 3 && remaining.length <= 4)) {
      results.push([
        ...prefixParts,
        { m: remaining, type: "root", gloss: "base" },
        ...suffixParts,
      ]);
      return;
    }

    // Try suffixes first (more productive in English)
    for (const suf of SUFFIXES) {
      if (remaining.endsWith(suf.form) && remaining.length > suf.form.length + 2) {
        let stem = remaining.slice(0, -suf.form.length);
        // Orthographic adjustments
        if (ROOTS.has(stem + "e") && !ROOTS.has(stem)) stem = stem + "e"; // e-deletion
        if (stem.length >= 3) {
          strip(
            stem,
            prefixParts,
            [{ m: suf.form, type: "suffix", gloss: suf.gloss }, ...suffixParts],
            depth + 1
          );
        }
      }
    }

    // Try prefixes
    for (const pre of PREFIXES) {
      if (remaining.startsWith(pre.form) && remaining.length > pre.form.length + 2) {
        const stem = remaining.slice(pre.form.length);
        strip(
          stem,
          [...prefixParts, { m: pre.form, type: "prefix", gloss: pre.gloss }],
          suffixParts,
          depth + 1
        );
      }
    }
  }

  strip(lc, [], [], 0);

  if (results.length === 0) {
    return [{ m: word, type: "root", gloss: "base" }];
  }

  // Return the parse with the most parts (deepest decomposition)
  results.sort((a, b) => b.length - a.length);
  return results[0];
}

// Batch analyze unique words in a corpus
export function analyzeCorpusMorphology(tokens) {
  const unique = [...new Set(tokens.map((t) => t.toLowerCase()))];
  const analyses = new Map();
  for (const word of unique) {
    if (word.length >= 3 && /^[a-z]+$/.test(word)) {
      analyses.set(word, analyzeMorphemes(word));
    }
  }
  return analyses;
}
