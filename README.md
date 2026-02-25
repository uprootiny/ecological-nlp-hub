# Ecological NLP Research Hub

This repository holds the architectural blueprint and implementation plan for an ecological, resource-aware NLP exploration system described through 12 research-focused web interfaces, plus a simplified resilient mode for snappy/guarded operations.

- `ARCHITECTURE.md` explains the guiding principles, layered architecture, interface mappings, and operational hooks that keep the UI and backend aligned.
- `IMPLEMENTATION_PLAN.md` details storage, compute, governance, and monitoring decisions along with next steps toward building the stack.

Use this project as the foundation to assemble the React front-end, Go-backed API, and orchestration layers needed to operationalize the design. 

Refer to `SIMPLIFIED_RESILIENT_SYSTEM.md` for the pared-down, high-resilience variant that keeps only the snappy surfaces and energy guards.

See `ROADMAP.md` for the planned milestones toward a `v1.0.0` point release and the CI/observability checkpoints that keep the project healthy.

## Running the Go backend + UI

- Build the front-end assets first (`npm run build`) and run the Go server (`cd backend && go run main.go`). The server embeds `dist/` and exposes `/api/concordance` + `/api/metaops` on port 49152, so the React shell can fetch real data; `VITE_API_BASE` can be used to point to a different host if needed.
- For development, keep `npm run dev -- --host 0.0.0.0` running and use the Go server only for API responses (Vite proxies `/api` to `localhost:49152`).
- The Dockerfile now sequentially builds the SPA (Node) and Go binary, then combines them into a distroless image that serves the SPA + APIs on port 49152 with minimal surface area. Build it with `docker build -t ecological-nlp-hub .` and run with `docker run -p 49152:49152 ecological-nlp-hub`.

- The Go backend exposes `/metrics` for Prometheus scraping and `/api/status` for quick instrumentation lookups; the MetaOps deck surfaces `metrics` data (requests, latency, energy signal) so you can monitor the stack in real-time alongside Grafana/Prom alerts.

## Running & Packaging

- `npm run dev -- --host 0.0.0.0` starts the Vite server; the interface now lazily loads panels and pulls Concordance + MetaOps data through `src/services/api.js` with the Go APIs proxied on `49152`.
- `npm run build` creates the production bundle, and `docker build -t ecological-nlp-hub .` / `docker run -p 49152:49152 ecological-nlp-hub` packages the site via the provided Dockerfile. `.dockerignore` keeps node_modules, dist, and Git metadata out of the container.
- The `.github/workflows/ci.yml` pipeline runs on every push/PR to `main`/`master`, performing `npm ci` and `npm run build` to guard the deployment artifact.
- When the workflow succeeds on `main`/`master`, the same job publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`, so you can host the site on GitHub Pages (configure repo -> settings -> pages to serve from `gh-pages`).  
