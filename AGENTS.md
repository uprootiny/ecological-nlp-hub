## Agent Approach

1. **Understand intent from UI + architectural prompts.** Start by aligning with described UX concepts ("Corpora Interfaces", MetaOps deck) and interpret what systems/features the user wants.
2. **Build runnable foundations first.** Scaffold Vite + React, iterate UI components, then layer backend services (Go). Ensure builds (`npm run build`) pass before adding complexity.
3. **Keep documentation synced.** Update `README.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md` whenever new features (simplified mode, instrumentation, docker flows, etc.) land.
4. **Prefer instrumented resilience.** Add observability early (e.g., Prometheus metrics, MetaOps insights) to keep the stack traceable.
5. **Iterate in small commits.** Capture each major idea in a commit, describe boilerplate additions (Docs, docker, instrumentation) clearly for traceability.
