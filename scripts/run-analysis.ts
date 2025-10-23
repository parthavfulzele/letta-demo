import { runMatchAnalyses, fetchRecentSummaries, type MatchSummaryRow } from "../src/lib/matchAnalysisWorker";

async function main() {
  try {
    console.log("Running Phoenix Rivals match analyses via Letta…");
    const results = await runMatchAnalyses();
    console.log(`Generated ${results.length} summaries:`);
    for (const result of results) {
      console.log(
        `• ${result.matchId} (${result.matchDate}) — ${result.summary.slice(0, 80)}${
          result.summary.length > 80 ? "…" : ""
        }`,
      );
    }

    console.log("\nLatest stored summaries (Supabase):");
    const latest = await fetchRecentSummaries(3);
    latest.forEach((row: MatchSummaryRow) => {
      console.log(`• ${row.match_id} -> ${row.summary}`);
    });
  } catch (error) {
    console.error("Worker run failed:", error);
    process.exitCode = 1;
  }
}

main();
