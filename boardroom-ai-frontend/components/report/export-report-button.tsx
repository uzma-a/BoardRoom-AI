"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { BoardResolution } from "@/types/board";
import { generateExecutiveReportPdf } from "@/lib/pdf/generate-report";

interface ExportReportButtonProps {
  resolution: BoardResolution;
  ideaSummary: string;
}

export function ExportReportButton({ resolution, ideaSummary }: ExportReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleExport() {
    setIsGenerating(true);
    try {
      await generateExecutiveReportPdf(resolution, ideaSummary);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={isGenerating}>
      {isGenerating ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
      Export Report
    </Button>
  );
}
