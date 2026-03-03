// External data source connectors for corpus acquisition

// Project Gutenberg plain text fetcher
const GUTENBERG_TEXTS = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
  { id: 84, title: "Frankenstein", author: "Mary Shelley" },
  { id: 1080, title: "A Modest Proposal", author: "Jonathan Swift" },
  { id: 98, title: "A Tale of Two Cities", author: "Charles Dickens" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { id: 1232, title: "The Prince", author: "Niccolò Machiavelli" },
  { id: 76, title: "Adventures of Huckleberry Finn", author: "Mark Twain" },
  { id: 345, title: "Dracula", author: "Bram Stoker" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë" },
  { id: 16328, title: "Beowulf", author: "Anonymous" },
  { id: 2600, title: "War and Peace", author: "Leo Tolstoy" },
  { id: 1400, title: "Great Expectations", author: "Charles Dickens" },
  { id: 5200, title: "Metamorphosis", author: "Franz Kafka" },
  { id: 244, title: "A Study in Scarlet", author: "Arthur Conan Doyle" },
  { id: 1952, title: "The Yellow Wallpaper", author: "Charlotte Perkins Gilman" },
  { id: 2591, title: "Grimms' Fairy Tales", author: "Brothers Grimm" },
  { id: 35, title: "The Time Machine", author: "H.G. Wells" },
  { id: 43, title: "The Strange Case of Dr Jekyll and Mr Hyde", author: "R.L. Stevenson" },
  { id: 2554, title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { id: 1497, title: "The Republic", author: "Plato" },
  { id: 4300, title: "Ulysses", author: "James Joyce" },
  { id: 514, title: "Little Women", author: "Louisa May Alcott" },
];

export async function fetchGutenbergText(id, maxChars = 100000) {
  const mirrors = [
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
  ];

  for (const url of mirrors) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      let text = await res.text();

      // Strip Gutenberg header/footer
      const startMarkers = ["*** START OF", "***START OF", "*** START OF THE PROJECT"];
      const endMarkers = ["*** END OF", "***END OF", "*** END OF THE PROJECT"];

      for (const marker of startMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1) {
          const lineEnd = text.indexOf("\n", idx);
          text = text.slice(lineEnd + 1);
          break;
        }
      }
      for (const marker of endMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1) {
          text = text.slice(0, idx);
          break;
        }
      }

      // Clean up
      text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

      // Truncate if very long
      if (text.length > maxChars) {
        text = text.slice(0, maxChars);
        const lastPeriod = text.lastIndexOf(".");
        if (lastPeriod > maxChars * 0.8) text = text.slice(0, lastPeriod + 1);
      }

      return text;
    } catch {
      continue;
    }
  }
  throw new Error(`Failed to fetch Gutenberg text #${id}`);
}

export { GUTENBERG_TEXTS };

// Wikipedia article text fetcher
export async function fetchWikipediaArticle(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Get the full HTML content for more text
    const htmlUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
    const htmlRes = await fetch(htmlUrl, { signal: AbortSignal.timeout(15000) });
    if (!htmlRes.ok) return { title: data.title, text: data.extract || "" };
    const html = await htmlRes.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    // Remove non-content elements
    doc.querySelectorAll("table, .reference, .reflist, .mw-editsection, sup, .navbox, .sidebar, .infobox, .toc, style, script, .mw-empty-elt").forEach((el) => el.remove());
    const paragraphs = [...doc.querySelectorAll("p")].map((p) => p.textContent.trim()).filter((t) => t.length > 20);
    return { title: data.title, text: paragraphs.join("\n\n") };
  } catch (err) {
    throw new Error(`Failed to fetch Wikipedia article: ${err.message}`);
  }
}

// Curated Wikipedia article collections by topic
export const WIKIPEDIA_COLLECTIONS = {
  "Linguistics": [
    "Linguistics", "Syntax", "Morphology_(linguistics)", "Phonology", "Semantics",
    "Pragmatics", "Sociolinguistics", "Historical_linguistics", "Computational_linguistics",
    "Corpus_linguistics", "Psycholinguistics", "Neurolinguistics"
  ],
  "Philosophy": [
    "Philosophy", "Epistemology", "Metaphysics", "Ethics", "Logic",
    "Philosophy_of_mind", "Philosophy_of_language", "Aesthetics"
  ],
  "Biology": [
    "Biology", "Evolution", "Genetics", "Cell_(biology)", "Ecology",
    "Molecular_biology", "Neuroscience", "Microbiology"
  ],
  "Computer Science": [
    "Computer_science", "Algorithm", "Machine_learning", "Artificial_intelligence",
    "Natural_language_processing", "Database", "Cryptography", "Operating_system"
  ],
  "History": [
    "Ancient_Rome", "Ancient_Greece", "Renaissance", "Industrial_Revolution",
    "World_War_I", "World_War_II", "Cold_War", "French_Revolution"
  ],
};

// Generic URL text extractor
export async function fetchUrlText(url) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, nav, header, footer, aside, .sidebar, .menu, .ad, .advertisement, .cookie, .popup").forEach((el) => el.remove());
  const text = (doc.body?.innerText || doc.body?.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 50) throw new Error("Could not extract meaningful text from URL");
  return text;
}

// Export data to CSV/JSON
export function exportToCSV(data, headers) {
  const rows = [headers.join(",")];
  for (const row of data) {
    rows.push(headers.map((h) => {
      const val = row[h] ?? "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(","));
  }
  return rows.join("\n");
}

export function exportToJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function downloadBlob(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
