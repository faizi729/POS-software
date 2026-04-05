export function cleanOcrTextForAi(raw: string) {
  // Keep line structure but remove obvious noise chars and normalize whitespace.
  return raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/[₹$]/g, " ")
        .replace(/[•·]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

