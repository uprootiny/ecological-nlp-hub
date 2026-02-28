// Penn Treebank-style tokenizer with sentence segmentation

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "inc", "ltd",
  "dept", "est", "approx", "govt", "assn", "bros", "corp", "jan", "feb",
  "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
  "st", "ave", "blvd", "i.e", "e.g", "cf", "al", "ed", "vol",
]);

const CONTRACTIONS = /^(.*?)(n't|'re|'ve|'ll|'d|'s|'m)$/i;

export function segmentSentences(text) {
  const sentences = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if (text[i] === "." || text[i] === "!" || text[i] === "?") {
      const next = i + 1 < text.length ? text[i + 1] : "";
      const words = current.trim().split(/\s+/);
      const lastWord = (words[words.length - 1] || "").replace(/[.!?]+$/, "").toLowerCase();
      if (
        !ABBREVIATIONS.has(lastWord) &&
        (next === "" || /\s/.test(next) || /[A-Z"'\u201C\u201D([]/.test(next))
      ) {
        const trimmed = current.trim();
        if (trimmed) sentences.push(trimmed);
        current = "";
      }
    }
  }
  const trimmed = current.trim();
  if (trimmed) sentences.push(trimmed);
  return sentences;
}

export function tokenize(text) {
  // Split on whitespace and punctuation boundaries
  let tokens = text
    .replace(/([^\w\s\-'])/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  // Handle contractions
  const expanded = [];
  for (const t of tokens) {
    const match = t.match(CONTRACTIONS);
    if (match) {
      if (match[1]) expanded.push(match[1]);
      expanded.push(match[2]);
    } else {
      expanded.push(t);
    }
  }
  return expanded.filter((t) => t.length > 0);
}

export function tokenizeCorpus(text) {
  const sentences = segmentSentences(text);
  const allTokens = [];
  const sentenceOffsets = [];
  for (const sent of sentences) {
    const start = allTokens.length;
    const tokens = tokenize(sent);
    allTokens.push(...tokens);
    sentenceOffsets.push({ start, end: allTokens.length, text: sent });
  }
  return { tokens: allTokens, sentences: sentenceOffsets };
}
