// KWIC Concordance engine with inverted index

export function buildInvertedIndex(tokens) {
  const index = new Map();
  for (let i = 0; i < tokens.length; i++) {
    const lc = tokens[i].toLowerCase();
    if (!index.has(lc)) index.set(lc, []);
    index.get(lc).push(i);
  }
  return index;
}

export function searchConcordance(tokens, index, keyword, windowSize = 7) {
  const lc = keyword.toLowerCase();
  const positions = index.get(lc);
  if (!positions) return [];

  return positions.map((pos) => {
    const leftStart = Math.max(0, pos - windowSize);
    const rightEnd = Math.min(tokens.length, pos + windowSize + 1);

    return {
      position: pos,
      left: tokens.slice(leftStart, pos).join(" "),
      keyword: tokens[pos],
      right: tokens.slice(pos + 1, rightEnd).join(" "),
    };
  });
}

export function concordanceSortModes(lines, mode = "position") {
  const sorted = [...lines];
  switch (mode) {
    case "left":
      sorted.sort((a, b) => {
        const aWords = a.left.split(" ").reverse();
        const bWords = b.left.split(" ").reverse();
        return (aWords[0] || "").localeCompare(bWords[0] || "");
      });
      break;
    case "right":
      sorted.sort((a, b) => {
        const aWords = a.right.split(" ");
        const bWords = b.right.split(" ");
        return (aWords[0] || "").localeCompare(bWords[0] || "");
      });
      break;
    case "frequency":
      // Already sorted by position, which approximates document order
      break;
    default:
      sorted.sort((a, b) => a.position - b.position);
  }
  return sorted;
}
