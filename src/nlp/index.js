// NLP Engine - unified entry point
export { segmentSentences, tokenize, tokenizeCorpus } from "./tokenizer.js";
export { buildFrequencyProfile, buildGenreFrequencyMatrix } from "./frequency.js";
export { buildInvertedIndex, searchConcordance, concordanceSortModes } from "./concordance.js";
export { extractNgrams, extractBigrams } from "./ngrams.js";
export { computeCollocations } from "./collocations.js";
export { analyzeMorphemes, analyzeCorpusMorphology } from "./morphology.js";
