package main

import (
	"embed"
	"encoding/json"
	"log"
	"net/http"
	"path"
	"time"
)

type ConcordanceLine struct {
	Left  string `json:"left"`
	Kw    string `json:"kw"`
	Right string `json:"right"`
}

type ConcordancePayload struct {
	Keyword string           `json:"keyword"`
	Lines   []ConcordanceLine `json:"lines"`
}

type MetaOpsPayload struct {
	Edges          []string          `json:"edges"`
	Messages       []MetaOpsMessage  `json:"messages"`
	Commits        []MetaOpsCommit   `json:"commits"`
	Checks         []MetaOpsCheck    `json:"checks"`
	Prompts        []MetaOpsPrompt   `json:"prompts"`
	ExtensionNames []string          `json:"extensionNames"`
	EnergySignal   string            `json:"energySignal"`
	Status         string            `json:"status"`
	CacheStatus    string            `json:"cacheStatus"`
}

type MetaOpsMessage struct {
	Agent string `json:"agent"`
	Title string `json:"title"`
	Detail string `json:"detail"`
	When  string `json:"when"`
	Badge string `json:"badge"`
}

type MetaOpsCommit struct {
	Branch   string `json:"branch"`
	Status   string `json:"status"`
	Progress int    `json:"progress"`
	Label    string `json:"label"`
}

type MetaOpsCheck struct {
	Title string `json:"title"`
	Desc  string `json:"desc"`
	Ok    bool   `json:"ok"`
}

type MetaOpsPrompt struct {
	Name   string `json:"name"`
	Prompt string `json:"prompt"`
	Focus  string `json:"focus"`
}

var concordanceLines = []ConcordanceLine{
	{Left: "the historical study of", Kw: "language", Right: "change reveals patterns"},
	{Left: "a formal model of", Kw: "language", Right: "structure was proposed"},
	{Left: "children acquire their first", Kw: "language", Right: "through social interaction"},
	{Left: "the boundaries between", Kw: "language", Right: "and dialect are fluid"},
	{Left: "computational approaches to", Kw: "language", Right: "processing have advanced"},
	{Left: "signed and spoken", Kw: "language", Right: "share deep structural"},
	{Left: "every natural human", Kw: "language", Right: "exhibits recursive syntax"},
	{Left: "the politics of", Kw: "language", Right: "policy affects education"},
	{Left: "contact between any two", Kw: "language", Right: "varieties produces creoles"},
	{Left: "documentation of endangered", Kw: "language", Right: "families remains urgent"},
}

var metaOps = MetaOpsPayload{
	Edges: []string{
		"LLM → Reasoning Loop",
		"Tool Call Circuit",
		"Ontological Prism Layer",
		"Meta-Abstraction Filter",
		"Subagent Feedback Bus",
	},
	Messages: []MetaOpsMessage{
		{
			Agent:  "Expedite",
			Title:  "Roadmap pulse",
			Detail: "Healthy commits + tests are shipping ahead of the Vision S print.",
			When:   "02:12",
			Badge:  "Committed",
		},
		{
			Agent:  "Guardian",
			Title:  "Architecture sanity check",
			Detail: "Ontology prisming still maps cleanly to the layered abstractions.",
			When:   "02:09",
			Badge:  "Aligned",
		},
		{
			Agent:  "Navigator",
			Title:  "LLM / tool loop",
			Detail: "Inference cycles are hitting 8 edges with 92% success.",
			When:   "01:58",
			Badge:  "Stable",
		},
	},
	Commits: []MetaOpsCommit{
		{Branch: "main", Status: "healthy", Progress: 78, Label: "Release cadence"},
		{Branch: "metaops", Status: "monitoring", Progress: 42, Label: "Roadmap stretch"},
		{Branch: "docs", Status: "review", Progress: 63, Label: "Architecture living doc"},
	},
	Checks: []MetaOpsCheck{
		{Title: "Roadmap tractability", Desc: "Milestones align with current compute / steward budgets.", Ok: true},
		{Title: "Architecture coherence", Desc: "Layers still reflect corpus stewardship → governance.", Ok: true},
		{Title: "High-fidelity requests", Desc: "Adaptive precision toggles have guardrails.", Ok: false},
	},
	Prompts: []MetaOpsPrompt{
		{Name: "Design System Guardian", Prompt: "Ensure every interface mirrors the ontology prism.", Focus: "Consistency"},
		{Name: "Commit Health Coach", Prompt: "Highlight roadblocks and get commits green.", Focus: "Progress"},
		{Name: "MetaOps Conductor", Prompt: "Keep the CTO channel grounded in actionable insights.", Focus: "Clarity"},
	},
	ExtensionNames: []string{
		"Concordance Helix",
		"Morpheme Forge",
		"Collocate Gravity",
		"Diachronic Strata",
		"Syntactic Cartography",
		"Frequency Thermograph",
	},
	EnergySignal: "green",
	Status:       "live",
	CacheStatus:  "fresh",
}

var (
	//go:embed dist/*
	staticFiles embed.FS
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/concordance", handleConcordance)
	mux.HandleFunc("/api/metaops", handleMetaOps)
	mux.Handle("/", http.FileServer(http.FS(staticFiles)))
	server := &http.Server{
		Addr:         ":8080",
		Handler:      withLogging(mux),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
	log.Printf("serving on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}

func handleConcordance(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, ConcordancePayload{
		Keyword: "language",
		Lines:   concordanceLines,
	})
}

func handleMetaOps(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, metaOps)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "max-age=30")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func withLogging(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%s] %s", r.Method, r.URL.Path)
		h.ServeHTTP(w, r)
	})
}
