import { cleanOcrTextForAi } from "@/lib/ocr/ocr-text-clean";

export type OcrSection = {
  category: string;
  text: string;
};

const keywordCategories = [
  "PIZZA",
  "BURGER",
  "SALAD",
  "SHAWARMA",
  "SNACKS",
  "FRIES",
  "SANDWICH",
  "PASTA",
  "NOODLES",
  "DRINK",
  "BEVERAGES",
  "DESSERT"
];

function isCategoryHeader(line: string) {
  const cleaned = line.trim();
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (/^\d+\.\s/.test(cleaned)) return false;
  if (/\d/.test(cleaned)) return false;

  const upper = cleaned.toUpperCase();
  const letters = upper.replace(/[^A-Z]/g, "");
  if (!letters) return false;
  const upperRatio = letters.length / cleaned.replace(/[^A-Za-z]/g, "").length;
  if (upperRatio >= 0.8) return true;

  return keywordCategories.some((keyword) => upper.includes(keyword));
}

export function splitOcrTextIntoSections(rawOcrText: string) {
  const cleaned = cleanOcrTextForAi(rawOcrText);
  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);

  const sections: OcrSection[] = [];
  let current: OcrSection = { category: "Uncategorized", text: "" };
  let buffer: string[] = [];

  function flush() {
    if (buffer.length === 0) return;
    current.text = buffer.join("\n");
    sections.push(current);
    buffer = [];
  }

  for (const line of lines) {
    if (isCategoryHeader(line)) {
      flush();
      current = { category: line.trim().replace(/:$/, ""), text: "" };
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections.filter((section) => section.text.trim().length > 0);
}

