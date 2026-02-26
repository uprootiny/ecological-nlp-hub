## Handoff for Claude Code

1. **Clone and bootstrap**
   - `git clone <repo-url> ecological-nlp-hub`
   - `cd ecological-nlp-hub`
   - `npm ci`

2. **Build assets**
   - `npm run build` (ensures `dist/` is fresh for Go embedding and CI).  
   - `cd backend && go build -o ../bin/ecological-nlp-hub ./main.go`

3. **Run locally**
   - `cd backend && ./bin/ecological-nlp-hub` (listens on port 49152).  
   - Alternatively `docker build -t ecological-nlp-hub .` + `docker run -p 49152:49152 ecological-nlp-hub`.

4. **Testing + instrumentation**
   - Visit `http://localhost:49152/` for the SPA, `http://localhost:49152/metrics` for Prometheus, and `http://localhost:49152/api/status` for health/energy info.
   - Validate MetaOps deck shows metrics, and check gcc/Go logs.

5. **CI/CD notes**
   - GitHub Actions: `ci.yml` runs `npm ci`, `npm run build`, copies `dist/`, builds Go binary, and publishes `dist/` to `gh-pages`.
   - Release steps: follow `ROADMAP.md` (Milestone 2 for observability, Milestone 3 for v1.0.0).

6. **Next tasks**
   - Hook real corpus ingestion + caches as described in `ARCHITECTURE.md`.
   - Configure Prometheus/Grafana to scrape `/metrics` and write alerts for `energySignal`.
   - Tag `v1.0.0` once instrumentation/policy work completes and update README release notes.
