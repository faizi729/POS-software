"use client";

import { useState } from "react";

export function usePosFilters(initialCategory = "All") {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  return {
    query,
    setQuery,
    category,
    setCategory
  };
}
