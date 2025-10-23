import { Blob } from "buffer";
import type { LettaClient } from "@letta-ai/letta-client";
import type { MatchDataset } from "./matchData";
import { matchNamespace, namespaceMetadata } from "./namespaces";

async function findSourceByName(client: LettaClient, name: string) {
  const sources = await client.sources.list();
  return sources.find((source) => source.name === name);
}

async function ensureMatchSource(client: LettaClient, match: MatchDataset) {
  const name = matchNamespace(match.matchId);
  const metadata = namespaceMetadata(match.teamId, match.matchId);
  const existing = await findSourceByName(client, name);

  if (existing?.id) {
    return existing.id;
  }

  const created = await client.sources.create({
    name,
    description: `Data lake for match ${match.matchId} (${match.metadata.opponent})`,
    metadata: {
      ...metadata,
      uploadedAt: new Date().toISOString(),
    },
    instructions:
      "Contains structured scouting information for a single Phoenix Rivals match. Use metadata namespaces to filter relevant context.",
  });

  if (!created.id) {
    throw new Error(`Created Letta source missing id for ${name}`);
  }

  return created.id;
}

async function uploadJsonDocument(
  client: LettaClient,
  sourceId: string,
  filename: string,
  payload: unknown,
) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  await client.sources.files.upload(blob, sourceId, {
    name: filename,
    duplicateHandling: "replace",
  });
}

export async function syncMatchIntoLetta(client: LettaClient, match: MatchDataset) {
  const sourceId = await ensureMatchSource(client, match);

  await uploadJsonDocument(client, sourceId, "match_metadata.json", match.metadata);
  await uploadJsonDocument(client, sourceId, "player_bios.json", match.playerBios);
  await uploadJsonDocument(client, sourceId, "coach_strategies.json", match.coachStrategies);
  await uploadJsonDocument(client, sourceId, "event_metrics.json", {
    events: match.events,
    metrics: match.metrics,
  });

  return sourceId;
}
