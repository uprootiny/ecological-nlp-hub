# Roadmap toward 1.0.0 Point Release

## Mission
Ship a healthy, resource-conscious NLP research hub with extensible MetaOps observability and curated datasets; use this point release (v1.0.0) to ground the stack, align documentation, and prove deployment automation.

## Milestones

### Milestone 1 — Baseline Launch (v0.6)
*Goal:* Stabilize the UI + backend, document architecture, and ensure local+Docker builds succeed.
1. Finish Vite/React frontend with lazy MetaOps deck and UX scaffolding.
2. Add Go backend providing KWIC + MetaOps APIs, instrumentation endpoints, and Prometheus metrics.
3. Create distroless Dockerfile and CI pipeline that builds + publishes `dist/` to GitHub Pages.
4. Capture architecture/implementation plan + AGENTS playbook.

### Milestone 2 — Observability + Governance Hardened (v0.8)
*Goal:* Make the stack traceable and policy-ready before broad testing.
1. Integrate Prometheus instrumentation + `/api/status` for health insights; surface metrics in MetaOps.
2. Hook policy engine stub (OPA) or config read in backend to simulate dataset guardrails.
3. Add simplified resilient mode documentation and UI toggles for quick preview vs. deep inference.
4. Run integration smoke tests (npm build, go build, Docker run) and log results for release notes.

### Milestone 3 — Point Release (v1.0.0)
*Goal:* Demonstrate a release candidate with monitored deployment + dataset readiness.
1. Connect backend to curated corpus ingest pipelines + caching layer (can be mocked but documented).
2. Wire Prometheus + Grafana dashboards; publish monitoring instructions in README.
3. Publish release tag `v1.0.0`, update `README`/docs with release notes, and highlight instrumentation/energy status.

## Ongoing Workstreams
- **CI/CD health:** ensure GitHub Actions build/test/deploy on every push; monitor for failures and fix quickly.  
- **Instrumentation:** keep `/metrics`, `/api/status`, MetaOps readouts fresh in dashboards; alert when energySignal flips to red.  
- **Documentation:** align `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `README.md`, and `AGENTS.md` to describe each milestone and release expectations.

## Next Actions for Point Release
1. Complete Milestone 2 tasks (observability + policy hooks).  
2. Prepare release notes for Milestone 3 and define real corpora/data to ship.  
3. Tag v1.0.0 once tests pass, then update GitHub Pages with release artifacts + monitoring tips.
