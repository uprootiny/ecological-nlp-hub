// NLP Pipeline: orchestrates tokenization, analysis, and caching

import { tokenizeCorpus } from "./tokenizer.js";
import { buildFrequencyProfile, buildGenreFrequencyMatrix } from "./frequency.js";
import { buildInvertedIndex, searchConcordance } from "./concordance.js";
import { extractNgrams, extractBigrams } from "./ngrams.js";
import { computeCollocations } from "./collocations.js";
import { analyzeMorphemes, analyzeCorpusMorphology } from "./morphology.js";
import { tagSentence, posDistribution } from "./pos-tagger.js";
import { lemmatizeTagged } from "./lemmatizer.js";
import { computeReadability, interpretFleschEase } from "./readability.js";
import { keywordAnalysis, corpusDispersion } from "./keywords.js";

// In-memory processed corpus store
const processedCorpora = new Map();

// Lazy analysis cache (computed on demand)
const analysisCache = new Map();

function getCached(corpusName, key, computeFn) {
  const cacheKey = `${corpusName}::${key}`;
  if (analysisCache.has(cacheKey)) return analysisCache.get(cacheKey);
  const result = computeFn();
  analysisCache.set(cacheKey, result);
  // LRU eviction
  if (analysisCache.size > 100) {
    const first = analysisCache.keys().next().value;
    analysisCache.delete(first);
  }
  return result;
}

export function processCorpus(name, text) {
  const { tokens, sentences } = tokenizeCorpus(text);
  const invertedIndex = buildInvertedIndex(tokens);
  const freqProfile = buildFrequencyProfile(tokens);

  const corpus = {
    name,
    text,
    tokens,
    sentences,
    invertedIndex,
    freqProfile,
    wordCount: tokens.length,
    sentenceCount: sentences.length,
    typeCount: freqProfile.types,
  };

  processedCorpora.set(name, corpus);

  // Invalidate analysis cache for this corpus
  for (const key of analysisCache.keys()) {
    if (key.startsWith(`${name}::`)) analysisCache.delete(key);
  }

  return corpus;
}

export function getProcessedCorpus(name) {
  return processedCorpora.get(name) || null;
}

export function getAllProcessedCorpora() {
  return [...processedCorpora.values()];
}

export function removeProcessedCorpus(name) {
  processedCorpora.delete(name);
  for (const key of analysisCache.keys()) {
    if (key.startsWith(`${name}::`)) analysisCache.delete(key);
  }
}

// ── Core analysis functions ──────────────────────────────

export function getConcordance(corpusName, keyword, windowSize = 7) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return searchConcordance(corpus.tokens, corpus.invertedIndex, keyword, windowSize);
}

export function getNgrams(corpusName, n = 3, minFreq = 2) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return getCached(corpusName, `ngrams-${n}-${minFreq}`, () =>
    extractNgrams(corpus.tokens, n, minFreq)
  );
}

export function getBigrams(corpusName, minFreq = 2) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return getCached(corpusName, `bigrams-${minFreq}`, () =>
    extractBigrams(corpus.tokens, minFreq)
  );
}

export function getCollocations(corpusName, node, span = 5, minFreq = 2) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return computeCollocations(corpus.tokens, node, span, minFreq);
}

export function getMorphology(word) {
  return analyzeMorphemes(word);
}

export function getCorpusMorphology(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return new Map();
  return getCached(corpusName, "morphology", () =>
    analyzeCorpusMorphology(corpus.tokens)
  );
}

export function getFrequencyMatrix(corpusNames) {
  const corpora = corpusNames
    .map((name) => {
      const c = processedCorpora.get(name);
      return c ? { name: c.name, tokens: c.tokens } : null;
    })
    .filter(Boolean);
  if (corpora.length === 0) return null;
  return buildGenreFrequencyMatrix(corpora);
}

export function getVocabulary(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return corpus.freqProfile.topWords;
}

// ── POS tagging & lemmatization ──────────────────────────

export function getTaggedSentences(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return getCached(corpusName, "tagged", () => {
    return corpus.sentences.slice(0, 50).map((sent) => {
      const tokens = sent.text.split(/\s+/).filter(Boolean);
      const tagged = tagSentence(tokens);
      return lemmatizeTagged(tagged);
    });
  });
}

export function getPOSDistribution(corpusName) {
  const tagged = getTaggedSentences(corpusName);
  return posDistribution(tagged);
}

// ── Readability ──────────────────────────────────────────

export function getReadability(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return null;
  return getCached(corpusName, "readability", () => {
    const result = computeReadability(corpus.tokens, corpus.sentenceCount);
    if (result) {
      result.interpretation = interpretFleschEase(result.fleschEase);
    }
    return result;
  });
}

// ── Keyword analysis ─────────────────────────────────────

export function getKeywords(targetName, referenceName, minFreq = 3) {
  const target = processedCorpora.get(targetName);
  const reference = processedCorpora.get(referenceName);
  if (!target || !reference) return [];
  return keywordAnalysis(
    target.freqProfile.freq,
    target.freqProfile.tokenCount,
    reference.freqProfile.freq,
    reference.freqProfile.tokenCount,
    minFreq
  );
}

// ── Dispersion ───────────────────────────────────────────

export function getDispersion(corpusName, numParts = 5) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return null;
  return getCached(corpusName, `dispersion-${numParts}`, () =>
    corpusDispersion(corpus.tokens, numParts)
  );
}

// ── Statistics ───────────────────────────────────────────

export function getCorpusStats(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return null;
  const fp = corpus.freqProfile;
  const readability = getReadability(corpusName);
  return {
    name: corpus.name,
    tokens: fp.tokenCount,
    types: fp.types,
    ttr: fp.ttr,
    mattr: fp.mattr,
    hapaxCount: fp.hapaxCount,
    hapaxRatio: fp.hapaxRatio,
    zipfFit: fp.zipfFit,
    sentences: corpus.sentenceCount,
    readability,
  };
}

export function compareCorpora(corpusNames) {
  return corpusNames.map(getCorpusStats).filter(Boolean);
}
