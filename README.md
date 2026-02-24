# Ecological NLP Research Hub

This repository holds the architectural blueprint and implementation plan for an ecological, resource-aware NLP exploration system described through 12 research-focused web interfaces, plus a simplified resilient mode for snappy/guarded operations.

- `ARCHITECTURE.md` explains the guiding principles, layered architecture, interface mappings, and operational hooks that keep the UI and backend aligned.
- `IMPLEMENTATION_PLAN.md` details storage, compute, governance, and monitoring decisions along with next steps toward building the stack.

Use this project as the foundation to assemble the React front-end, backend services, and orchestrations needed to operationalize the design. 

Refer to `SIMPLIFIED_RESILIENT_SYSTEM.md` for the pared-down, high-resilience variant that keeps only the snappy surfaces and energy guards.

## Running & Packaging

- `npm run dev -- --host 0.0.0.0` starts the Vite server; the interface now lazily loads panels and pulls Concordance + MetaOps data from `src/services/mockApi.js` so the UI stays responsive.
- `npm run build` creates the production bundle, and `docker build -t ecological-nlp-hub .` / `docker run -p 4173:4173 ecological-nlp-hub` packages the site via the provided Dockerfile. `.dockerignore` keeps node_modules, dist, and Git metadata out of the container.
- The `.github/workflows/ci.yml` pipeline runs on every push/PR to `main`/`master`, performing `npm ci` and `npm run build` to guard the deployment artifact.
