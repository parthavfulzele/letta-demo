import { NextResponse } from "next/server";
import { runMatchAnalyses } from "@/lib/matchAnalysisWorker";

export const runtime = "nodejs";

export async function POST() {
  const results = await runMatchAnalyses();
  return NextResponse.json({
    processed: results.length,
    results,
  });
}
