// Keyword analysis: log-likelihood comparison, chi-squared, dispersion measures

// Log-likelihood (G²) keyword comparison (Rayson & Garside 2000)
export function keywordAnalysis(targetFreq, targetN, referenceFreq, referenceN, minFreq = 3) {
  const results = [];

  for (const [word, O1] of targetFreq) {
    if (O1 < minFreq) continue;
    const O2 = referenceFreq.get(word) || 0;
    const N1 = targetN;
    const N2 = referenceN;
    const E1 = N1 * (O1 + O2) / (N1 + N2);
    const E2 = N2 * (O1 + O2) / (N1 + N2);

    // G² log-likelihood
    const G2 =
      2 * ((O1 > 0 ? O1 * Math.log(O1 / E1) : 0) +
           (O2 > 0 ? O2 * Math.log(O2 / E2) : 0));

    // Effect size: log ratio
    const relFreq1 = O1 / N1;
    const relFreq2 = (O2 || 0.5) / N2; // smoothing
    const logRatio = Math.log2(relFreq1 / relFreq2);

    // %DIFF
    const pctDiff = ((relFreq1 - relFreq2) / relFreq2) * 100;

    // BIC (Bayesian Information Criterion) for significance
    const bic = G2 - Math.log(N1 + N2);

    // Direction: positive = overused in target, negative = underused
    const direction = relFreq1 > relFreq2 ? "+" : "-";

    results.push({
      word,
      freqTarget: O1,
      freqRef: O2,
      relFreqTarget: relFreq1 * 10000, // per 10k
      relFreqRef: relFreq2 * 10000,
      G2: Math.round(G2 * 100) / 100,
      logRatio: Math.round(logRatio * 100) / 100,
      pctDiff: Math.round(pctDiff * 10) / 10,
      bic: Math.round(bic * 100) / 100,
      direction,
      significant: G2 > 3.84, // p < 0.05 with 1 df
      verySignificant: G2 > 15.13, // p < 0.0001
    });
  }

  // Sort by G² descending
  results.sort((a, b) => b.G2 - a.G2);
  return results;
}

// Chi-squared test for comparing distributions
export function chiSquared(observed, expected) {
  let chi2 = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      chi2 += Math.pow(observed[i] - expected[i], 2) / expected[i];
    }
  }
  return chi2;
}

// Juilland's D dispersion measure
// Parts: an array of frequencies in equal-sized parts of the corpus
export function juillandsD(partsFrequencies) {
  const n = partsFrequencies.length;
  if (n < 2) return 1;
  const mean = partsFrequencies.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  const variance = partsFrequencies.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const cv = Math.sqrt(variance) / mean; // coefficient of variation
  const D = 1 - cv / Math.sqrt(n - 1);
  return Math.max(0, Math.min(1, D)); // clamp to [0,1]
}

// DP (Deviation of Proportions) - Gries (2008)
export function deviationOfProportions(partsFrequencies, partsSizes) {
  const totalFreq = partsFrequencies.reduce((s, v) => s + v, 0);
  const totalSize = partsSizes.reduce((s, v) => s + v, 0);
  if (totalFreq === 0 || totalSize === 0) return 0;

  let sumAbsDiff = 0;
  for (let i = 0; i < partsFrequencies.length; i++) {
    const expectedProportion = partsSizes[i] / totalSize;
    const observedProportion = partsFrequencies[i] / totalFreq;
    sumAbsDiff += Math.abs(observedProportion - expectedProportion);
  }

  return sumAbsDiff / 2; // 0 = perfectly even, 1 = maximally uneven
}

// Compute dispersion for all words across corpus parts
export function corpusDispersion(tokens, numParts = 5) {
  const partSize = Math.ceil(tokens.length / numParts);
  const parts = [];
  for (let i = 0; i < numParts; i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, tokens.length);
    parts.push(tokens.slice(start, end));
  }

  const partsSizes = parts.map((p) => p.length);

  // Count frequencies in each part
  const allWords = new Set(tokens.map((t) => t.toLowerCase()));
  const results = [];

  for (const word of allWords) {
    const partsFreqs = parts.map((p) => p.filter((t) => t.toLowerCase() === word).length);
    const totalFreq = partsFreqs.reduce((s, v) => s + v, 0);
    if (totalFreq < 3) continue;

    const D = juillandsD(partsFreqs);
    const DP = deviationOfProportions(partsFreqs, partsSizes);

    results.push({
      word,
      totalFreq,
      partsFreqs,
      juillandsD: Math.round(D * 1000) / 1000,
      dp: Math.round(DP * 1000) / 1000,
      // Adjusted frequency (Juilland's U = D × f)
      adjustedFreq: Math.round(D * totalFreq * 100) / 100,
    });
  }

  results.sort((a, b) => b.adjustedFreq - a.adjustedFreq);
  return { results: results.slice(0, 100), numParts, partsSizes };
}
