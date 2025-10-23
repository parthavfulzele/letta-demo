import { NextRequest, NextResponse } from "next/server";
import { fetchRecentSummaries, type MatchSummaryRow } from "@/lib/matchAnalysisWorker";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { question } = await request.json();
  const normalizedQuestion = String(question ?? "").toLowerCase();

  const rows = await fetchRecentSummaries(3);
  const matches = rows.map((row: MatchSummaryRow) => ({
    matchId: row.match_id,
    teamId: row.team_id,
    matchDate: row.match_date,
    summary: row.summary,
    recommendations: row.recommendations,
    riskNotes: row.risk_notes,
  }));

  if (normalizedQuestion.includes("summarize last 3 matches")) {
    return NextResponse.json({
      question,
      matches,
    });
  }

  return NextResponse.json({
    question,
    matches,
    note: "Query did not match known prompts. Returning recent summaries without aggregation.",
  });
}
