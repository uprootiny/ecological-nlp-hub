// Frequency analysis: distributions, TTR, MATTR, Zipf, hapax

export function buildFrequencyProfile(tokens) {
  const freq = new Map();
  const lcTokens = tokens.map((t) => t.toLowerCase());

  for (const t of lcTokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  const types = freq.size;
  const tokenCount = tokens.length;
  const ttr = tokenCount > 0 ? types / tokenCount : 0;

  // Hapax legomena
  let hapaxCount = 0;
  for (const [, count] of freq) {
    if (count === 1) hapaxCount++;
  }
  const hapaxRatio = types > 0 ? hapaxCount / types : 0;

  // MATTR (Moving Average Type-Token Ratio, window=500)
  const WINDOW = Math.min(500, Math.floor(tokenCount / 2));
  let mattrSum = 0;
  let mattrN = 0;
  if (WINDOW > 10) {
    for (let i = 0; i <= tokenCount - WINDOW; i += Math.max(1, Math.floor(WINDOW / 5))) {
      const windowSet = new Set();
      for (let j = i; j < i + WINDOW; j++) {
        windowSet.add(lcTokens[j]);
      }
      mattrSum += windowSet.size / WINDOW;
      mattrN++;
    }
  }
  const mattr = mattrN > 0 ? mattrSum / mattrN : ttr;

  // Sorted frequency list for Zipf
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  // Top N words
  const topWords = sorted.slice(0, 50).map(([word, count]) => ({
    word,
    count,
    relFreq: count / tokenCount,
  }));

  // Zipf fit (Pearson correlation of log-rank vs log-freq)
  let zipfFit = 0;
  if (sorted.length > 10) {
    const logRanks = [];
    const logFreqs = [];
    for (let i = 0; i < Math.min(sorted.length, 1000); i++) {
      logRanks.push(Math.log(i + 1));
      logFreqs.push(Math.log(sorted[i][1]));
    }
    zipfFit = Math.abs(pearsonCorrelation(logRanks, logFreqs));
  }

  return {
    freq,
    types,
    tokenCount,
    ttr,
    mattr,
    hapaxCount,
    hapaxRatio,
    zipfFit,
    topWords,
    sorted,
  };
}

function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 2) return 0;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// Genre-bucketed frequency matrix
export function buildGenreFrequencyMatrix(corpora) {
  // corpora: [{name, tokens}]
  // returns matrix[word][genre] = normalized frequency
  const allWords = new Map();
  const profiles = corpora.map((c) => buildFrequencyProfile(c.tokens));

  // Collect top words across all corpora
  for (const p of profiles) {
    for (const { word } of p.topWords.slice(0, 30)) {
      if (!allWords.has(word)) allWords.set(word, new Array(corpora.length).fill(0));
    }
  }

  // Fill matrix
  for (let gi = 0; gi < profiles.length; gi++) {
    for (const [word, row] of allWords) {
      const count = profiles[gi].freq.get(word) || 0;
      row[gi] = count / profiles[gi].tokenCount * 10000; // per 10k words
    }
  }

  return {
    words: [...allWords.keys()],
    genres: corpora.map((c) => c.name),
    matrix: [...allWords.values()],
    profiles,
  };
}
