# Ecological NLP Hub — Architectural Specification

## System Overview

A browser-native NLP research workbench with 12 interactive corpus analysis interfaces backed by a Go instrumentation server. Operates in two modes: **static** (GitHub Pages, client-side NLP) and **full-stack** (Go backend + hot caches + batch pipelines).

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT (React/Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Concordanc│ │Morpheme  │ │Collocate │ │Diachronic│  ...×12   │
│  │  Helix   │ │  Forge   │ │ Gravity  │ │ Strata   │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │            │             │                │
│  ┌────▼─────────────▼────────────▼─────────────▼────────────┐  │
│  │              NLP Processing Pipeline                      │  │
│  │  Tokenizer → Normalizer → Analyzer → Statistician        │  │
│  │  (Web Workers for CPU-intensive operations)               │  │
│  └────┬──────────────────────────────────────────────┬──────┘  │
│       │                                              │         │
│  ┌────▼──────┐                              ┌───────▼───────┐ │
│  │ IndexedDB │                              │ Data Acquirer  │ │
│  │  Corpus   │                              │ fetch/paste/   │ │
│  │  Store    │                              │ file/API       │ │
│  └───────────┘                              └───────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │ /api/* (when backend present)
                    ┌───────────▼───────────┐
                    │   Go Backend (49152)   │
                    │  embed.FS + Prometheus │
                    │  + KWIC + MetaOps APIs │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
        ┌──────────┐    ┌───────────┐     ┌──────────────┐
        │ Hot Cache│    │Prometheus │     │ Policy Engine│
        │Redis/SQL │    │ /metrics  │     │   (OPA)      │
        └──────────┘    └───────────┘     └──────────────┘
```

---

## 1. Data Acquisition Layer

### 1.1 Corpus Ingestion Pipeline

```
Input Sources                   Processing Chain
─────────────                   ────────────────
Text paste ──┐
File upload ─┤                  ┌─────────────┐
URL fetch ───┼──── Ingest() ──►│ Fingerprint  │──► Dedup Check
API pull ────┤                  │ (SHA-256)    │       │
Gutenberg ───┘                  └─────────────┘       │
                                      ┌───────────────▼──────────┐
                                      │ Normalize                │
                                      │  • Unicode NFC           │
                                      │  • Whitespace collapse   │
                                      │  • Sentence segmentation │
                                      │    (regex + abbrev list) │
                                      └──────────┬──────────────┘
                                                  ▼
                                      ┌──────────────────────┐
                                      │ Tokenize             │
                                      │  • Word boundary     │
                                      │    detection         │
                                      │  • Punctuation split │
                                      │  • Number grouping   │
                                      └──────────┬──────────┘
                                                  ▼
                                      ┌──────────────────────┐
                                      │ Store (IndexedDB)    │
                                      │  • Raw text blobs    │
                                      │  • Token arrays      │
                                      │  • Metadata (source, │
                                      │    date, license)    │
                                      └──────────────────────┘
```

**Algorithm: Sentence Segmentation**
```
segmentSentences(text):
  abbreviations = {"Mr", "Mrs", "Dr", "vs", "etc", "i.e", "e.g", ...}
  sentences = []
  current = ""
  for each char c at position i in text:
    current += c
    if c in {'.', '!', '?'}:
      next_char = text[i+1] if i+1 < len(text) else EOF
      prev_word = extractLastWord(current)
      if prev_word not in abbreviations AND
         (next_char is uppercase OR next_char is EOF OR next_char is whitespace):
        sentences.append(current.trim())
        current = ""
  if current.trim(): sentences.append(current.trim())
  return sentences
```

**Algorithm: Tokenization (Penn Treebank-style)**
```
tokenize(sentence):
  // Phase 1: Separate punctuation
  tokens = regex_split(sentence, /(\s+|(?<=[^\w\s])|(?=[^\w\s]))/)
  // Phase 2: Handle contractions
  for each token t:
    if matches(t, /^(.*)(n't|'re|'ve|'ll|'d|'s|'m)$/i):
      split into [stem, clitic]
  // Phase 3: Handle hyphenated compounds
  for each token t:
    if contains(t, '-') AND length(t) > 3:
      keep as single token (compound)
  return filter(tokens, t -> t.trim().length > 0)
```

### 1.2 Public Data Sources (Client-Side Fetch)

| Source | URL Pattern | Data Type | Rate Limit |
|--------|------------|-----------|------------|
| Project Gutenberg | `gutenberg.org/files/{id}/` | Full text | Respectful |
| Wiktionary API | `en.wiktionary.org/api/rest_v1/` | Definitions, etymology | 200/s |
| Wikipedia API | `en.wikipedia.org/api/rest_v1/` | Article text | 200/s |
| Open Corpora | CORS-proxied endpoints | Tagged text | Varies |

---

## 2. NLP Processing Engine (Client-Side, Web Workers)

### 2.1 Concordance / KWIC Engine

**Algorithm: Bidirectional Context Window Search**
```
buildKWICIndex(tokens[], keyword, windowSize=5):
  index = []
  normalizedKw = lowercase(keyword)
  for i = 0 to len(tokens)-1:
    if lowercase(tokens[i]) == normalizedKw:
      left  = tokens[max(0, i-windowSize) .. i-1].join(" ")
      right = tokens[i+1 .. min(len(tokens)-1, i+windowSize)].join(" ")
      index.append({
        position: i,
        left: left,
        keyword: tokens[i],  // preserve original case
        right: right,
        docId: currentDoc,
        sentenceIdx: sentenceOf(i)
      })
  return index

// Sort modes:
//   left-context:  sort by reversed left string (alphabetical of preceding word)
//   right-context: sort by right string
//   frequency:     sort by collocation MI score at position
```

**Complexity:** O(n) scan per keyword, O(n log n) sort. Pre-indexed via inverted index for O(1) lookup.

### 2.2 Frequency Analysis Engine

**Algorithm: Frequency Distribution with Register Bucketing**
```
buildFrequencyProfile(tokens[]):
  // Raw frequency
  freq = CounterMap()
  for t in tokens: freq[lowercase(t)] += 1

  // Type-Token Ratio (TTR)
  types = len(freq.keys())
  tokens_count = len(tokens)
  ttr = types / tokens_count

  // Hapax legomena (frequency == 1)
  hapax = [w for w in freq if freq[w] == 1]
  hapax_ratio = len(hapax) / types

  // Zipf's law verification
  ranked = sort(freq.values(), descending)
  zipf_fit = pearson_correlation(
    [log(rank) for rank in 1..len(ranked)],
    [log(f) for f in ranked]
  )

  // Moving Average Type-Token Ratio (MATTR, window=500)
  mattr_values = []
  for i in range(0, tokens_count - 500, 100):
    window = tokens[i:i+500]
    window_types = len(set(lowercase(w) for w in window))
    mattr_values.append(window_types / 500)
  mattr = mean(mattr_values)

  return { freq, types, tokens_count, ttr, mattr, hapax_ratio, zipf_fit }
```

### 2.3 N-gram Extraction Engine

**Algorithm: Sliding Window N-gram with PMI Scoring**
```
extractNgrams(tokens[], n=3, minFreq=2):
  ngrams = CounterMap()
  unigrams = CounterMap()

  for i = 0 to len(tokens) - n:
    gram = tuple(lowercase(tokens[i:i+n]))
    ngrams[gram] += 1
    for t in gram: unigrams[t] += 1

  // Filter by minimum frequency
  filtered = {g: c for g, c in ngrams if c >= minFreq}

  // Compute Pointwise Mutual Information (PMI)
  N = len(tokens)
  for gram, count in filtered:
    p_gram = count / (N - n + 1)
    p_independent = product(unigrams[w] / N for w in gram)
    pmi = log2(p_gram / p_independent)
    filtered[gram].pmi = pmi

  // Compute log-likelihood ratio (G²) for significance
  for gram, count in filtered:
    O11 = count                           // gram observed
    O12 = unigrams[gram[0]] - count       // first word without rest
    O21 = unigrams[gram[-1]] - count      // last word without first
    O22 = N - O11 - O12 - O21            // neither
    G2 = 2 * sum(Oij * ln(Oij / Eij) for all cells)
    filtered[gram].logLikelihood = G2

  return sorted(filtered, key=pmi, descending)
```

### 2.4 Collocation Analysis (MI, T-Score, Log-Likelihood)

**Algorithm: Multi-Metric Collocation Scorer**
```
computeCollocations(tokens[], node, span=5, minFreq=3):
  N = len(tokens)
  nodeFreq = count(tokens, node)
  collocates = CounterMap()

  // Collect co-occurrences within span
  for i where tokens[i] == node:
    for j in range(max(0,i-span), min(N,i+span+1)):
      if j != i:
        collocates[tokens[j]] += 1

  results = []
  for collocate, observed in collocates:
    if observed < minFreq: continue
    collocateFreq = count(tokens, collocate)
    expected = (nodeFreq * collocateFreq) / N

    // Mutual Information: log2(observed / expected)
    mi = log2(observed / expected)

    // MI³ (cubed MI to reduce low-frequency bias)
    mi3 = log2(observed³ / expected)

    // T-score: (observed - expected) / sqrt(observed)
    tscore = (observed - expected) / sqrt(observed)

    // Log-likelihood (G²)
    // ... (2x2 contingency table as in n-gram section)

    // Dice coefficient: 2 * observed / (nodeFreq + collocateFreq)
    dice = 2 * observed / (nodeFreq + collocateFreq)

    results.append({ collocate, observed, mi, mi3, tscore, dice })

  return sorted(results, key=mi, descending)
```

### 2.5 Morphological Analyzer

**Algorithm: Rule-Based Affix Stripping (Porter-inspired + extension)**
```
analyzeMorphemes(word):
  affixes = loadAffixTable()  // prefix/suffix rules with glosses
  results = []

  // Step 1: Try known decompositions (lexicon lookup)
  if word in morphemeLexicon:
    return morphemeLexicon[word]

  // Step 2: Recursive affix stripping
  function strip(remaining, parts, depth):
    if depth > 6: return  // max derivational depth
    if remaining in rootLexicon:
      results.append(parts + [{m: remaining, type: "root"}])
      return

    // Try prefixes
    for prefix in affixes.prefixes:
      if remaining.startsWith(prefix.form):
        rest = remaining.slice(prefix.form.length)
        if len(rest) >= 3:  // minimum stem length
          strip(rest, parts + [{m: prefix.form, type: "prefix", gloss: prefix.gloss}], depth+1)

    // Try suffixes
    for suffix in affixes.suffixes:
      if remaining.endsWith(suffix.form):
        rest = remaining.slice(0, -suffix.form.length)
        // Apply orthographic rules (e.g., doubling, e-deletion)
        rest = applyOrthoRules(rest, suffix)
        if len(rest) >= 3:
          strip(rest, [{m: suffix.form, type: "suffix", gloss: suffix.gloss}] + parts, depth+1)

  strip(word, [], 0)
  return bestDecomposition(results)  // shortest valid parse
```

### 2.6 Semantic Drift Detection

**Algorithm: Temporal Embedding Comparison (Cosine Distance over Epochs)**
```
computeDrift(word, corpusSlices[]):
  // For each time slice, build word2vec-style embeddings
  embeddings = {}
  for slice in corpusSlices:
    // Build co-occurrence matrix (PPMI)
    cooccur = buildCooccurrenceMatrix(slice.tokens, window=5)
    // SVD reduction to d=100 dimensions
    U, S, Vt = truncatedSVD(ppmi(cooccur), d=100)
    embeddings[slice.era] = U[word]

  // Align embeddings across time (Procrustes)
  base = embeddings[corpusSlices[0].era]
  for era in corpusSlices[1:]:
    R = orthogonalProcrustes(embeddings[era], base)
    embeddings[era] = embeddings[era] @ R

  // Compute drift as cosine distance between consecutive epochs
  drift_series = []
  for i in range(1, len(corpusSlices)):
    prev = embeddings[corpusSlices[i-1].era]
    curr = embeddings[corpusSlices[i].era]
    cos_dist = 1 - dot(prev, curr) / (norm(prev) * norm(curr))
    drift_series.append({
      from: corpusSlices[i-1].era,
      to: corpusSlices[i].era,
      drift: cos_dist
    })

  return drift_series
```

---

## 3. Visualization Architecture

### 3.1 Interface-Algorithm Binding

| Interface | Primary Algorithm | Data Source | Complexity |
|-----------|------------------|-------------|------------|
| Concordance Helix | KWIC index + inverted lookup | Hot cache / IndexedDB | O(1) lookup, O(n) build |
| Morpheme Forge | Affix stripping + lexicon | Rule tables + cache | O(d × a) per word, d=depth, a=affixes |
| Collocate Gravity | MI/T-score/Dice collocation | Precomputed collocate table | O(n × s) build, s=span |
| Diachronic Strata | Temporal frequency partitioning | Time-indexed corpus store | O(n) per slice |
| Syntactic Cartography | Dependency parse (CYK/Eisner) | Warm annotation cache | O(n³) parse, cached |
| Frequency Thermograph | Freq dist + genre bucketing | Materialized frequency grid | O(n) build, O(1) read |
| Semantic Drift | SVD + Procrustes alignment | Cold embedding store | O(n²d) per epoch |
| Pragmatic Studio | Speech act classifier (SVM/rules) | Pragmatic tag cache | O(n × f) features |
| Phonotactic Lattice | Phoneme probability lookup | Static phonotactic tables | O(1) per syllable |
| Register Spectrum | Feature extraction (TTR, etc.) | Hot stats cache | O(n) per register |
| N-gram Tessellation | Sliding window + PMI scoring | Hot n-gram cache | O(n × k) k=n-gram size |
| Corpus Comparator | Aggregate stats comparison | Warm stats table | O(c × m) c=corpora |

### 3.2 Rendering Pipeline

```
User Interaction
       │
       ▼
┌──────────────┐
│ React State  │──── shouldRecompute? ──── No ──► Cached SVG/DOM
│ (useState)   │                │
└──────────────┘               Yes
                                │
                       ┌────────▼─────────┐
                       │ Web Worker Pool   │
                       │ (2-4 workers)     │
                       │                   │
                       │ postMessage({     │
                       │   type: "analyze",│
                       │   corpus: ref,    │
                       │   params: {...}   │
                       │ })                │
                       └────────┬─────────┘
                                │
                       ┌────────▼─────────┐
                       │ Result Cache      │
                       │ (LRU, 50 entries) │
                       └────────┬─────────┘
                                │
                       ┌────────▼─────────┐
                       │ useMemo() render  │
                       │ • SVG path calc   │
                       │ • Grid layout     │
                       │ • Color mapping   │
                       └──────────────────┘
```

---

## 4. Go Backend Architecture

### 4.1 Server Structure

```go
main.go
  ├── embed.FS (dist/)          // Static SPA files
  ├── /api/concordance          // KWIC lines (JSON)
  ├── /api/metaops              // MetaOps dashboard payload
  ├── /api/status               // Health + energy metrics
  ├── /metrics                  // Prometheus counters + histograms
  └── middleware
       ├── withLogging()        // Request logger
       └── instrumentHandler()  // Per-route Prometheus instrumentation
```

### 4.2 Instrumentation Model

```
Prometheus Metrics:
  ecological_nlp_requests_total{handler}       Counter    Per-endpoint request count
  ecological_nlp_request_duration_seconds{handler}  Histogram  Latency distribution

Internal Atomic Counters:
  requestTotal   uint64   Monotonic request count
  totalLatency   uint64   Cumulative microseconds (for rolling avg)
  energyState    atomic.Value   Cycles: green → amber → red (12s interval)

MetaOps Payload:
  {
    edges:          ["LLM → Reasoning Loop", ...],     // System topology
    messages:       [{agent, title, detail, badge}],    // CTO channel feed
    commits:        [{branch, status, progress}],       // Roadmap health
    checks:         [{title, desc, ok}],                // Architecture coherence
    prompts:        [{name, prompt, focus}],             // Agent promptset
    extensionNames: [...],                               // 12 NLP interfaces
    energySignal:   "green|amber|red",                  // System energy state
    metrics:        {requestsTotal, avgLatencyMs}        // Live instrumentation
  }
```

### 4.3 Energy-Aware Scheduling

```
cycleEnergyState():
  signals = ["green", "amber", "red"]
  i = 0
  loop forever:
    sleep(12s)
    i = (i + 1) % 3
    energyState.Store(signals[i])

// Production extension:
//   Replace timer with carbon-intensity API signal
//   Green: full compute budget
//   Amber: defer batch jobs, serve from cache
//   Red: reject heavy requests with 503 + Retry-After
```

---

## 5. Storage Architecture

### 5.1 Client-Side (IndexedDB Schema)

```
Database: ecological-nlp-hub

ObjectStore: corpora
  key: id (auto-increment)
  indexes: [name, source, importedAt]
  schema: {
    id, name, source, text, tokens[], sentences[],
    metadata: { license, date, wordCount, charCount },
    importedAt: Date
  }

ObjectStore: analyses
  key: [corpusId, analysisType]
  schema: {
    corpusId, analysisType,
    result: { ... },  // type-specific analysis output
    computedAt: Date,
    version: number
  }

ObjectStore: settings
  key: name
  schema: { name, value }
```

### 5.2 Server-Side (Full-Stack Mode)

```
Hot Tier (Redis/SQLite):
  kwic:{keyword}:{corpusId}     → KWIC index entries
  freq:{corpusId}               → Frequency table
  ngram:{n}:{corpusId}          → N-gram cache
  colloc:{node}:{corpusId}      → Collocation scores

Warm Tier (PostgreSQL):
  annotations(sentence_hash, pos_tags, dep_parse, pragmatic_tags, ttl)
  morphemes(word, decomposition[], source, confidence)
  corpus_stats(corpus_id, metric_name, value, computed_at)

Cold Tier (Object Storage):
  embeddings/{corpus_id}/{epoch}.faiss
  drift_metrics/{word}/{epoch_pair}.json
  raw_corpora/{corpus_id}.parquet
```

---

## 6. Deployment Topology

```
GitHub Pages (Static Mode):
  uprootiny.github.io/ecological-nlp-hub/
  ├── index.html           SPA entry
  ├── 404.html             SPA fallback routing
  ├── assets/
  │   ├── index-*.js       React bundle (~55KB gzip)
  │   └── index-*.css      Styles (~0.2KB)
  ├── .nojekyll            Bypass Jekyll processing
  └── data/
      ├── sample-corpus.json     Demo corpus for immediate use
      └── affix-table.json       Morphological rules

Docker (Full-Stack Mode):
  ecological-nlp-hub:49152
  ├── Go binary + embedded dist/
  ├── /api/* endpoints
  ├── /metrics (Prometheus)
  └── Health: /api/status

CI/CD:
  push → GitHub Actions
    ├── npm ci + npm run build
    ├── go mod tidy + go build
    └── peaceiris/actions-gh-pages → gh-pages branch
```
