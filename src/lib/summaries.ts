import type { Letta } from "@letta-ai/letta-client";
import type { MatchDataset } from "./matchData";

export interface MatchAnalysisPayload {
  matchId: string;
  teamId: string;
  matchDate: string;
  namespace: {
    team: string;
    match: string;
  };
  sourceId: string;
  agentId: string;
  summary: string;
  recommendations: string[];
  riskNotes: string[];
  raw: Record<string, unknown>;
}

export const matchSummaryResponseFormat: Letta.JsonSchemaResponseFormat = {
  type: "json_schema",
  jsonSchema: {
    name: "match_summary",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: {
          type: "string",
          description:
            "Concise narrative (120 words max) capturing what mattered in the match.",
        },
        recommendations: {
          type: "array",
          description: "Actionable coaching or training adjustments (2-4 items).",
          minItems: 2,
          maxItems: 4,
          items: {
            type: "string",
          },
        },
        risk_notes: {
          type: "array",
          description: "Emerging risks, injuries, or trends to monitor (1-3 items).",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "string",
          },
        },
      },
      required: ["summary", "recommendations", "risk_notes"],
    },
  },
};

export function buildSummarizationSystemPrompt(teamId: string) {
  return [
    "You are the performance analytics assistant for the Phoenix Rivals basketball program.",
    `Your job is to translate scouting documents into quick tactical insights for the coaching staff of team ${teamId}.`,
    "Only respond with JSON that obeys the provided schema.",
    "Be practical and reference recurring trends when relevant.",
  ].join(" ");
}

export function buildSummarizationUserPrompt(match: MatchDataset) {
  return [
    `Summarize the match played on ${match.metadata.date} against ${match.metadata.opponent}.`,
    "Highlight the decisive sequences, successful adjustments, and metrics that drove the result.",
    "Call out 2-4 targeted recommendations for the next practice or game plan.",
    "Flag any injuries, fatigue indicators, or strategic risks worth monitoring.",
    "Consult the Phoenix Rivals namespace documents (metadata, player bios, coach strategies, events, metrics).",
  ].join(" ");
}
