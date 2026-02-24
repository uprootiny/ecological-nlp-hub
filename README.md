# Ecological NLP Research Hub

This repository holds the architectural blueprint and implementation plan for an ecological, resource-aware NLP exploration system described through 12 research-focused web interfaces, plus a simplified resilient mode for snappy/guarded operations.

- `ARCHITECTURE.md` explains the guiding principles, layered architecture, interface mappings, and operational hooks that keep the UI and backend aligned.
- `IMPLEMENTATION_PLAN.md` details storage, compute, governance, and monitoring decisions along with next steps toward building the stack.

Use this project as the foundation to assemble the React front-end, Go-backed API, and orchestration layers needed to operationalize the design. 

Refer to `SIMPLIFIED_RESILIENT_SYSTEM.md` for the pared-down, high-resilience variant that keeps only the snappy surfaces and energy guards.

## Running the Go backend + UI

- Build the front-end assets first (`npm run build`) and run the Go server (`cd backend && go run main.go`). The server embeds `dist/` and exposes `/api/concordance` + `/api/metaops`, so the React shell can fetch real data; `VITE_API_BASE` can be used to point to a different host if needed.
- For development, keep `npm run dev -- --host 0.0.0.0` running and use the Go server only for API responses (Vite is already configured to proxy `/api` to `localhost:8080`).
- The Dockerfile now builds both the React bundle and Go binary, producing an Alpine image that serves the SPA + APIs on port 8080. Build it with `docker build -t ecological-nlp-hub .` and run with `docker run -p 8080:8080 ecological-nlp-hub`.

## Running & Packaging

- `npm run dev -- --host 0.0.0.0` starts the Vite server; the interface now lazily loads panels and pulls Concordance + MetaOps data from `src/services/mockApi.js` so the UI stays responsive.
- `npm run build` creates the production bundle, and `docker build -t ecological-nlp-hub .` / `docker run -p 4173:4173 ecological-nlp-hub` packages the site via the provided Dockerfile. `.dockerignore` keeps node_modules, dist, and Git metadata out of the container.
- The `.github/workflows/ci.yml` pipeline runs on every push/PR to `main`/`master`, performing `npm ci` and `npm run build` to guard the deployment artifact.
- When the workflow succeeds on `main`/`master`, the same job publishes `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`, so you can host the site on GitHub Pages (configure repo -> settings -> pages to serve from `gh-pages`).  
