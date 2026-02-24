# Ecological NLP Implementation Plan

## Objectives
- Translate the resource-mindful blueprint into a concrete stack (storage, compute, scheduling) that supports the 12 React interfaces without wasting cycles.
- Keep always-on services lightweight while isolating heavy inference and batch work behind gated components.
- Preserve provenance, governance, and energy-awareness through observability + policy enforcement.

## Layered Stack
| Layer | Role | Technologies | Notes |
| --- | --- | --- | --- |
| **Data Ingestion & Stewardship** | Validate licenses, normalize text/audio, dedup, store provenance | Python/Go ingest workers, Apache Beam or Airbyte connectors, object storage (S3-compatible) | Use manifest files for each import with license/consent metadata; store raw text/audio + metadata in cold tier (parquet + `metadata.json`). Compute fingerprint hashes for deduplication and ingestion idempotency. |
| **Hot Indexes & Stats** | Serve KWIC, frequencies, n-grams, register metrics | SQLite + Redis for fast reads, materialized views via PostgreSQL | Periodic jobs aggregate counts into SQLite/Redis; small dashboards read directly. Use Redis streams to push updates to clients when caches invalidate. |
| **Warm Annotation Services** | Morphology, syntax, pragmatics pipelines with caching | PostgreSQL for structured annotations, columnar store (DuckDB) for analytics, REST/gRPC API | Sentence-level hashed keys prevent duplicate parses. Cache TTLs per granularity (e.g., 30 days for syntax). Use job queue (Celery/RQ) to process on demand. |
| **Cold Embeddings & Drift** | Dense vectors, diachronic snapshots, metrics | FAISS/Weaviate for embeddings, Parquet/DeltaLake for temporal slices, Airflow-triggered batch jobs | Embeddings updated only when corpus volume crosses delta threshold. Semantic drift computed via incremental drift job (samples a subset) and stored in time-series store (TimescaleDB). |
| **Governance & Policy Layer** | Consent/licensing enforcement, privacy budgets, explainability tracking | Policy engine (OPA), metadata service, logging to ElasticSearch | Every analytic request checks policy metadata. Privacy budget enforced for aggregate stats through noise injection layer. Explainability metadata stored with each derived artifact via JSON-LD. |

## Interfaces & Services Mapping
- **React orchestration**: A single Next.js/React frontend (currently `CorporaInterfaces`) talks to a lightweight GraphQL/REST gateway that multiplexes requests to caches or services depending on the module ID.
- **Backend API Endpoints**: 
  - `/api/kwic` fetches KWIC index from SQLite/Redis; includes provenance metadata (document ID, era).
  - `/api/annotate/morph`, `/api/annotate/syntax`, `/api/annotate/pragmatics` hit warm annotation services (cached Postgres rows).
  - `/api/stats/collocate`, `/api/stats/ngram`, `/api/stats/register` serve aggregated tables, refreshed via incremental jobs.
  - `/api/drift` hits time-series store for drift metrics, and if missing, schedules an incremental job (with low priority).
  - `/api/embeddings` interacts with vector store for semantic drift snapshots and similarity lookups, gating on energy budget.
- **Interface-specific details**:
  - *Concordance Helix* & *N-gram Tessellation*: always read from hot indexes, serve either pre-aggregated tables or Redis caches keyed by keyword.
  - *Morpheme Forge*: hits morphological cache; no heavy models unless new word (rule-based heuristics) and then caches result in Postgres; track TTL.
  - *Collocate Gravity*: obtains collocate list from precomputed PMI table; asynchronous summarizer updates collocates via stream processing.
  - *Diachronic Strata*: interacts with time-partitioned stores (per era) and only samples (configurable ratio) when dataset large (>1B tokens).
  - *Syntactic Cartography* & *Pragmatic Studio*: call warm annotation service; queue deduplicated jobs in background queue; results stored for reuse.
  - *Frequency Thermograph* & *Register Spectrum*: simple histograms built daily; stored in SQLite/Redis, served instantly.
  - *Semantic Drift Observatory*: loads cached drift envelopes from TSDB; full recomputation only scheduled by batch job (e.g., Airflow) triggered by new snapshot.
  - *Phonotactic Lattice*: rule-based probability tables (static data in Redis or JSON). No backend inference required.
  - *Corpus Comparator Matrix*: uses warm stats table; hover details just reveal stored values; GraphQL schema returns preformatted metadata.

## Compute Orchestration
- **Scheduler**: Airflow or Prefect orchestrates nightly ingestion + heavy jobs. Define SLAs to only run embeddings once per corpus delta; `ResourceAwareOperator` throttles if energy-aware signal (from provider API) falls below threshold.
- **On-demand queue**: RQ/Celery worker pool processes parse/pragmatic jobs. Add priority tiers—interactive requests use `expedited` queue (limited, energy-checked); background recomputations use `standard` queue.
- **Cache warming**: After ingestion, Fire intents to rebuild KWIC, collocates, register metrics. Use DB triggers or streaming (Debezium + Kafka) to propagate counts into caches.

## Storage Strategy
- **Cold Tier**: Object storage (MinIO/S3) of raw data + processed embeddings (Parquet/Delta). Use lifecycle policies to move older slices to Glacier.
- **Warm Tier**: PostgreSQL for relational data, DuckDB tables for ad-hoc analytics, Redis for fast caches. Use column-store indexes for annotation features.
- **Hot Tier**: SQLite or Redis for immediate UI data (KWIC, frequency matrix) with TTLs; caches invalidated when ingest adds new documents that touch relevant keys.

## Energy & Resource Safeguards
- **Energy-aware policies**: Query gateway inspects `EnergyBudget` header (from scheduler or carbon API) and responds with `202 Accepted` + schedule job if heavy. Provide UI toggles for “High-fidelity mode” that explicitly request heavy compute.
- **Adaptive precision modes**: Quick preview (cache only) vs deep analysis (new inference). UI exposes lens to choose precision per interface; backend respects mode when deciding whether to trigger parse/embedding jobs.
- **Sampling & sketching**: When dataset > threshold, modules default to sample-based stats. Provide “full dataset” option but warn about energy impact, requiring explicit user consent.
- **Cache TTLs and invalidation**: Use versioned keys (`source_batch:v3`) so new ingestion invalidates dependent caches; optionally prewarm caches using scheduled jobs before the next shift.
- **Monitoring & alerting**: Prometheus + Grafana track API latencies, cache hit rates, queue lengths, energy budget usage, and compute resource consumption. Alert on cache stalls or backlog growth.

## Governance & Compliance
- **Policy engine**: OPA rules define allowed operations per dataset. API gateway checks policy result before returning data or triggering computation.
- **Provenance store**: Every artifact (embedding vector, parse, collocate stats) stores `source_id`, `batch_id`, `created_at`, `transformer_version`, and `policy_hash`.
- **Privacy budgets**: Frequency tables + register stats optionally pass through Laplace noise layer (configurable). Log noise parameters per request for auditing.

## Delivery & Deployment
- **Infrastructure**: Deploy services in Kubernetes (k8s) for scalability; use Helm charts for database + worker deployments. Redis/Postgres statefulsets with persistent volumes.
- **CI/CD**: GitHub Actions pipeline builds frontend, runs lint/tests, deploys to staging, triggers backend migrations, and notifies on ingestion job schedules.
- **Observability**: Use OpenTelemetry traces from API gateway to worker jobs to track lineage + energy usage (custom span attributes).
- **Prometheus instrumentation**: Go backend exposes `/metrics` for scraping and `/api/status` for quick instrumentation data; MetaOps pulls these metrics so the UI reflects realtime health and queue/budget status.

## Next Actions
1. Build prototype ingestion flow + cache layer for KWIC + n-grams to prove hot/hot warm tier interaction.
2. Implement policy metadata schema + enforcement in API gateway before layering heavy inference.
3. Create dashboards for energy usage + cache hit rate to keep resource budget visible to the team.
