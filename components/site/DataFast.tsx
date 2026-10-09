"use client";

import { useEffect } from "react";
import { bootDataFast } from "@/lib/datafast";

export function DataFast() {
  useEffect(() => {
    void bootDataFast();
  }, []);
  return null;
}
