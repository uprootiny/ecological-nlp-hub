// Readability indices and text statistics

// Syllable counter using English pronunciation heuristics
export function countSyllables(word) {
  const lc = word.toLowerCase().replace(/[^a-z]/g, "");
  if (lc.length <= 2) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (let i = 0; i < lc.length; i++) {
    const isVowel = vowels.includes(lc[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjustments
  if (lc.endsWith("e") && !lc.endsWith("le") && !lc.endsWith("ee") && !lc.endsWith("ie")) count--;
  if (lc.endsWith("es") && !lc.endsWith("ies") && !lc.endsWith("ees")) count--;
  if (lc.endsWith("ed") && !lc.endsWith("ied") && !lc.endsWith("eed") && lc.length > 3) count--;
  if (lc.endsWith("tion") || lc.endsWith("sion")) count--; // "tion" is one syllable, not two

  // Additions for common patterns
  if (lc.endsWith("ia") || lc.endsWith("io") || lc.endsWith("iu")) count++;
  if (lc.includes("eo") || lc.includes("ia") || lc.includes("iu")) count++;

  // Minimum 1 syllable
  return Math.max(1, count);
}

// Count complex words (3+ syllables, not proper nouns or compound)
function countComplexWords(tokens) {
  return tokens.filter((t) => {
    const clean = t.replace(/[^a-zA-Z]/g, "");
    return clean.length > 0 && countSyllables(clean) >= 3 && !/^[A-Z]/.test(t);
  }).length;
}

// Average sentence length in words
function avgSentenceLength(tokenCount, sentenceCount) {
  return sentenceCount > 0 ? tokenCount / sentenceCount : 0;
}

// Average syllables per word
function avgSyllablesPerWord(tokens) {
  if (tokens.length === 0) return 0;
  const total = tokens.reduce((s, t) => s + countSyllables(t), 0);
  return total / tokens.length;
}

// Average word length in characters
function avgWordLength(tokens) {
  if (tokens.length === 0) return 0;
  const wordTokens = tokens.filter((t) => /[a-zA-Z]/.test(t));
  return wordTokens.reduce((s, t) => s + t.length, 0) / (wordTokens.length || 1);
}

// Count characters (letters only)
function letterCount(tokens) {
  return tokens.reduce((s, t) => s + t.replace(/[^a-zA-Z]/g, "").length, 0);
}

export function computeReadability(tokens, sentenceCount) {
  const wordTokens = tokens.filter((t) => /[a-zA-Z]/.test(t));
  const N = wordTokens.length;
  const S = sentenceCount;
  if (N === 0 || S === 0) return null;

  const ASL = avgSentenceLength(N, S);
  const ASW = avgSyllablesPerWord(wordTokens);
  const AWL = avgWordLength(wordTokens);
  const totalSyllables = wordTokens.reduce((s, t) => s + countSyllables(t), 0);
  const complexWords = countComplexWords(wordTokens);
  const letters = letterCount(wordTokens);

  // Flesch Reading Ease (0-100, higher = easier)
  const fleschEase = 206.835 - 1.015 * ASL - 84.6 * ASW;

  // Flesch-Kincaid Grade Level
  const fleschKincaid = 0.39 * ASL + 11.8 * ASW - 15.59;

  // Gunning Fog Index
  const gunningFog = 0.4 * (ASL + 100 * (complexWords / N));

  // Coleman-Liau Index
  const L = (letters / N) * 100; // avg letters per 100 words
  const Sv = (S / N) * 100; // avg sentences per 100 words
  const colemanLiau = 0.0588 * L - 0.296 * Sv - 15.8;

  // Automated Readability Index (ARI)
  const ari = 4.71 * (letters / N) + 0.5 * ASL - 21.43;

  // SMOG Index (requires 30+ sentences ideally)
  const smog = 1.0430 * Math.sqrt(complexWords * (30 / Math.max(S, 1))) + 3.1291;

  // Dale-Chall approximation (using complex word percentage)
  const complexPct = (complexWords / N) * 100;
  let daleChall = 0.1579 * complexPct + 0.0496 * ASL;
  if (complexPct > 5) daleChall += 3.6365;

  // Linsear Write
  const easyWords = N - complexWords;
  let linsear = ((easyWords * 1 + complexWords * 3) / S);
  if (linsear > 20) linsear = linsear / 2;
  else linsear = (linsear - 1) / 2;

  return {
    fleschEase: Math.round(fleschEase * 10) / 10,
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    colemanLiau: Math.round(colemanLiau * 10) / 10,
    ari: Math.round(ari * 10) / 10,
    smog: Math.round(smog * 10) / 10,
    daleChall: Math.round(daleChall * 10) / 10,
    linsear: Math.round(linsear * 10) / 10,
    // Raw metrics
    avgSentenceLength: Math.round(ASL * 10) / 10,
    avgSyllablesPerWord: Math.round(ASW * 100) / 100,
    avgWordLength: Math.round(AWL * 10) / 10,
    complexWordPct: Math.round(complexPct * 10) / 10,
    totalSyllables,
    totalWords: N,
    totalSentences: S,
  };
}

// Interpret readability level
export function interpretFleschEase(score) {
  if (score >= 90) return { level: "Very Easy", grade: "5th grade", audience: "11-year-old" };
  if (score >= 80) return { level: "Easy", grade: "6th grade", audience: "12-year-old" };
  if (score >= 70) return { level: "Fairly Easy", grade: "7th grade", audience: "13-year-old" };
  if (score >= 60) return { level: "Standard", grade: "8th-9th grade", audience: "general public" };
  if (score >= 50) return { level: "Fairly Difficult", grade: "10th-12th grade", audience: "high school" };
  if (score >= 30) return { level: "Difficult", grade: "college", audience: "college student" };
  return { level: "Very Difficult", grade: "college graduate", audience: "specialist" };
}
