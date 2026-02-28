// NLP Pipeline: orchestrates tokenization, analysis, and caching

import { tokenizeCorpus } from "./tokenizer.js";
import { buildFrequencyProfile, buildGenreFrequencyMatrix } from "./frequency.js";
import { buildInvertedIndex, searchConcordance } from "./concordance.js";
import { extractNgrams, extractBigrams } from "./ngrams.js";
import { computeCollocations } from "./collocations.js";
import { analyzeMorphemes, analyzeCorpusMorphology } from "./morphology.js";

// In-memory processed corpus store
const processedCorpora = new Map();

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
}

// Analysis functions that work on processed corpora

export function getConcordance(corpusName, keyword, windowSize = 7) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return searchConcordance(corpus.tokens, corpus.invertedIndex, keyword, windowSize);
}

export function getNgrams(corpusName, n = 3, minFreq = 2) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return extractNgrams(corpus.tokens, n, minFreq);
}

export function getBigrams(corpusName, minFreq = 2) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return [];
  return extractBigrams(corpus.tokens, minFreq);
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
  return analyzeCorpusMorphology(corpus.tokens);
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

export function getCorpusStats(corpusName) {
  const corpus = processedCorpora.get(corpusName);
  if (!corpus) return null;
  const fp = corpus.freqProfile;
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
  };
}

export function compareCorpora(corpusNames) {
  return corpusNames.map(getCorpusStats).filter(Boolean);
}
