const BASE = import.meta.env.VITE_API_BASE ?? "";

const handleFetch = async (endpoint) => {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`failed to fetch ${endpoint}: ${res.status}`);
  }
  return res.json();
};

export const fetchConcordanceLines = () => handleFetch("/api/concordance");
export const fetchMetaOpsPayload = () => handleFetch("/api/metaops");
