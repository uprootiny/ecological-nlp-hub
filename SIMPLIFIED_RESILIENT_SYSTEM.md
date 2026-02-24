# Snappy Resilient Mode

When ruthless simplification is the goal, this variant keeps only the data and UI layers that must stay responsive while still guarding compute budgets and resilience.

## Essence
- **Surface**: Only the Concordance Helix + MetaOps deck remain “always-on”; other panels load through explicit user toggles so they never drag initial render.
- **Compute Path**: Serve KBs through hot caches (Redis/SQLite) without hitting annotation servers; any missing pieces are synthesized from precomputed sketches and served with TTL alarms.
- **Metadata**: All results tag `batch_id`, `source`, `service`, and `cache_ttl` so downstream callers understand freshness and can invalidate safely.

## Simplified Stack
1. **Hot Data Cache**  
   - Materialize KWIC segments, frequency tables, and commit health rows into Redis (or SQLite memory tables).  
   - Periodic delta refresh (every few minutes) driven by ingestion manifest.  
   - Serve `GET /api/kwic?keyword=language` straight from Redis; fallback hits sample table compiled at ingest time.
2. **Fence Inference**  
   - Heavy annotation, embeddings, and drift calculations live behind a gated queue (Prefect/Airflow) that only runs when `EnergyBudget` signal is healthy.  
   - UI toggles (e.g., “Deep mode”) must be explicity clicked to enqueue these jobs; default interactions never trigger them.
3. **Resilience Guards**  
   - Cache TTLs and versioned keys (e.g., `kwic:v3`) keep invalidations simple.  
   - Circuit breaker watches (latency > 250ms, errors > 5%) downgrade UI to sample-only views; we surface the degraded notice in MetaOps deck.  
   - Monitoring (Prometheus + Grafana) observes hit-rate & queue backlog; alerts fire before budgets are exceeded.

## UI + Experience
- **MetaOps Deck** becomes the “status + health” extension: shows commit + architecture checks even when other panels remain dormant.  
- **CTO Channel** highlights when caches refresh or when inference queue is paused due to energy (makes the resilience visible).  
- **Promptset Cards** describe the mode (snappy vs deep) and provide a manual “escalate compute” button; each click logs a telemetry event so we can track when heavy resources are consumed.

## Next Actions for Snappy Mode
1. Limit frontend to 2 panels (Concordance + MetaOps) on initial load; lazy-load other components via dynamic imports triggered by explicit user choices.  
2. Implement the `EnergyBudget` guard in the API gateway so heavy services refuse work when budgets low; surface the state in MetaOps channel.  
3. Document manual override on the UI, showing the cost vs value (to keep users aware of the resilience trade-offs).
