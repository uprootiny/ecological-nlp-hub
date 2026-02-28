// Collocation analysis: MI, T-score, log-likelihood, Dice

export function computeCollocations(tokens, node, span = 5, minFreq = 2) {
  const lcTokens = tokens.map((t) => t.toLowerCase());
  const lcNode = node.toLowerCase();
  const N = lcTokens.length;

  // Find all positions of the node word
  const nodePositions = [];
  for (let i = 0; i < N; i++) {
    if (lcTokens[i] === lcNode) nodePositions.push(i);
  }

  const nodeFreq = nodePositions.length;
  if (nodeFreq === 0) return [];

  // Count co-occurrences within span
  const cooccur = new Map();
  for (const pos of nodePositions) {
    for (let j = Math.max(0, pos - span); j < Math.min(N, pos + span + 1); j++) {
      if (j === pos) continue;
      const w = lcTokens[j];
      cooccur.set(w, (cooccur.get(w) || 0) + 1);
    }
  }

  // Count all word frequencies
  const freqMap = new Map();
  for (const t of lcTokens) {
    freqMap.set(t, (freqMap.get(t) || 0) + 1);
  }

  // Score collocates
  const results = [];
  for (const [collocate, observed] of cooccur) {
    if (observed < minFreq) continue;
    if (collocate === lcNode) continue;

    const collocateFreq = freqMap.get(collocate) || 0;
    const expected = (nodeFreq * collocateFreq) / N;
    if (expected === 0) continue;

    const mi = Math.log2(observed / expected);
    const mi3 = Math.log2(Math.pow(observed, 3) / expected);
    const tscore = (observed - expected) / Math.sqrt(observed);
    const dice = (2 * observed) / (nodeFreq + collocateFreq);

    // Log-likelihood G²
    const O11 = observed;
    const O12 = nodeFreq - observed;
    const O21 = collocateFreq - observed;
    const O22 = N - nodeFreq - collocateFreq + observed;
    const logL = (v, e) => (v > 0 && e > 0 ? v * Math.log(v / e) : 0);
    const E11 = (nodeFreq * collocateFreq) / N;
    const E12 = (nodeFreq * (N - collocateFreq)) / N;
    const E21 = ((N - nodeFreq) * collocateFreq) / N;
    const E22 = ((N - nodeFreq) * (N - collocateFreq)) / N;
    const G2 = 2 * (logL(O11, E11) + logL(O12, E12) + logL(O21, E21) + logL(O22, E22));

    results.push({
      word: collocate,
      observed,
      expected: Math.round(expected * 100) / 100,
      mi: Math.round(mi * 100) / 100,
      mi3: Math.round(mi3 * 100) / 100,
      tscore: Math.round(tscore * 100) / 100,
      dice: Math.round(dice * 1000) / 1000,
      logLikelihood: Math.round(G2 * 100) / 100,
      freq: collocateFreq,
    });
  }

  results.sort((a, b) => b.mi - a.mi);
  return results.slice(0, 50);
}
