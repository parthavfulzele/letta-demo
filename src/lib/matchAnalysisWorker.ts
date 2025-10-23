import type { SupabaseClient } from "@supabase/supabase-js";
import { createLettaClient } from "./letta";
import { loadMatchDatasets } from "./matchData";
import { syncMatchIntoLetta } from "./lettaIngest";
import { namespaceMetadata } from "./namespaces";
import {
  buildSummarizationSystemPrompt,
  buildSummarizationUserPrompt,
  matchSummaryResponseFormat,
  type MatchAnalysisPayload,
} from "./summaries";
import { getSupabaseServiceClient } from "./supabase";

interface MatchSummaryUpsert {
  match_id: string;
  team_id: string;
  match_date: string;
  source_id: string;
  agent_id: string;
  namespace: Record<string, string>;
  payload: Record<string, unknown>;
  summary: string;
  recommendations: string[];
  risk_notes: string[];
  analysis_generated_at: string;
}

interface AgentMessage {
  messageType?: string;
  content?: unknown;
}

function extractAssistantJson(messages: AgentMessage[]) {
  const assistant = [...messages]
    .reverse()
    .find((msg) => msg.messageType === "assistant_message");

  if (!assistant) {
    throw new Error("Letta response did not include an assistant message");
  }

  const content = assistant.content;
  if (typeof content !== "string") {
    throw new Error("Letta assistant message content was not a string");
  }

  return JSON.parse(content) as Record<string, unknown>;
}

async function storeSummary(
  supabase: SupabaseClient,
  payload: MatchAnalysisPayload,
) {
  const upsertPayload: MatchSummaryUpsert = {
    match_id: payload.matchId,
    team_id: payload.teamId,
    match_date: payload.matchDate,
    source_id: payload.sourceId,
    agent_id: payload.agentId,
    namespace: payload.namespace,
    payload: payload.raw,
    summary: payload.summary,
    recommendations: payload.recommendations,
    risk_notes: payload.riskNotes,
    analysis_generated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("match_summaries")
    .upsert(upsertPayload, { onConflict: "match_id" });

  if (error) {
    throw new Error(`Failed to store summary in Supabase: ${error.message}`);
  }
}

export async function runMatchAnalyses() {
  const client = createLettaClient();
  const supabase = getSupabaseServiceClient();
  const matches = await loadMatchDatasets();

  const results: MatchAnalysisPayload[] = [];

  for (const match of matches) {
    const namespace = namespaceMetadata(match.teamId, match.matchId);
    const sourceId = await syncMatchIntoLetta(client, match);

    const agent = await client.agents.create({
      name: `analysis-${namespace.match}`,
      model: "openai/gpt-4o-mini",
      embedding: "openai/text-embedding-3-small",
      system: buildSummarizationSystemPrompt(match.teamId),
      sourceIds: [sourceId],
      responseFormat: matchSummaryResponseFormat,
      metadata: {
        ...namespace,
        matchDate: match.metadata.date,
      },
      includeBaseTools: false,
    });

    const turn = await client.agents.messages.create(agent.id, {
      messages: [
        {
          role: "user",
          content: buildSummarizationUserPrompt(match),
        },
      ],
    });

    const parsed = extractAssistantJson(turn.messages as AgentMessage[]);

    const summaryPayload: MatchAnalysisPayload = {
      matchId: match.matchId,
      teamId: match.teamId,
      matchDate: match.metadata.date,
      namespace,
      sourceId,
      agentId: agent.id,
      summary: String(parsed.summary ?? ""),
      recommendations: Array.isArray(parsed.recommendations)
        ? (parsed.recommendations as string[])
        : [],
      riskNotes: Array.isArray(parsed.risk_notes)
        ? (parsed.risk_notes as string[])
        : [],
      raw: parsed,
    };

    await storeSummary(supabase, summaryPayload);
    results.push(summaryPayload);

    await client.agents.delete(agent.id);
  }

  return results;
}

export interface MatchSummaryRow {
  match_id: string;
  team_id: string;
  match_date: string;
  source_id: string;
  agent_id: string;
  namespace: Record<string, string>;
  payload: Record<string, unknown>;
  summary: string;
  recommendations: string[];
  risk_notes: string[];
  analysis_generated_at: string;
}

export async function fetchRecentSummaries(limit = 3): Promise<MatchSummaryRow[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("match_summaries")
    .select("*")
    .order("match_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch summaries: ${error.message}`);
  }

  return (data ?? []) as MatchSummaryRow[];
}
