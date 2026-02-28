// N-gram extraction with PMI and log-likelihood scoring

export function extractNgrams(tokens, n = 3, minFreq = 2) {
  const lcTokens = tokens.map((t) => t.toLowerCase());
  const N = lcTokens.length;
  if (N < n) return [];

  // Count n-grams
  const ngramCounts = new Map();
  for (let i = 0; i <= N - n; i++) {
    const gram = lcTokens.slice(i, i + n).join(" ");
    ngramCounts.set(gram, (ngramCounts.get(gram) || 0) + 1);
  }

  // Count unigrams
  const unigramCounts = new Map();
  for (const t of lcTokens) {
    unigramCounts.set(t, (unigramCounts.get(t) || 0) + 1);
  }

  // Filter and score
  const results = [];
  for (const [gram, count] of ngramCounts) {
    if (count < minFreq) continue;

    const words = gram.split(" ");
    const pGram = count / (N - n + 1);

    // PMI: log2(P(gram) / product(P(word_i)))
    let pIndependent = 1;
    for (const w of words) {
      pIndependent *= (unigramCounts.get(w) || 1) / N;
    }
    const pmi = Math.log2(pGram / pIndependent);

    // Log-likelihood (simplified for bigrams, extended for n-grams)
    const logLikelihood = 2 * count * Math.log(pGram / pIndependent);

    results.push({
      gram,
      words,
      count,
      pmi: Math.round(pmi * 100) / 100,
      logLikelihood: Math.round(logLikelihood * 100) / 100,
      relFreq: count / (N - n + 1),
    });
  }

  results.sort((a, b) => b.pmi - a.pmi);
  return results.slice(0, 100);
}

// Bigram-specific extraction with full statistical suite
export function extractBigrams(tokens, minFreq = 2) {
  const lcTokens = tokens.map((t) => t.toLowerCase());
  const N = lcTokens.length;
  if (N < 2) return [];

  const bigramCounts = new Map();
  const unigramCounts = new Map();

  for (let i = 0; i < N; i++) {
    unigramCounts.set(lcTokens[i], (unigramCounts.get(lcTokens[i]) || 0) + 1);
    if (i < N - 1) {
      const bg = `${lcTokens[i]} ${lcTokens[i + 1]}`;
      bigramCounts.set(bg, (bigramCounts.get(bg) || 0) + 1);
    }
  }

  const results = [];
  for (const [bg, O11] of bigramCounts) {
    if (O11 < minFreq) continue;
    const [w1, w2] = bg.split(" ");
    const f1 = unigramCounts.get(w1) || 0;
    const f2 = unigramCounts.get(w2) || 0;
    const expected = (f1 * f2) / N;

    const mi = Math.log2(O11 / expected);
    const mi3 = Math.log2(Math.pow(O11, 3) / expected);
    const tscore = (O11 - expected) / Math.sqrt(O11);
    const dice = (2 * O11) / (f1 + f2);

    results.push({ bigram: bg, w1, w2, count: O11, mi, mi3, tscore, dice });
  }

  return results;
}
