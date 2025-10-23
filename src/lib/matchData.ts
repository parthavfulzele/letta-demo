import fs from "fs/promises";
import path from "path";

export interface MatchMetadata {
  opponent: string;
  date: string;
  location: string;
  competition: string;
  result: string;
  score: {
    team: number;
    opponent: number;
  };
  narrative: string;
}

export interface PlayerBio {
  playerId: string;
  name: string;
  position: string;
  experience: string;
  playingStyle: string;
  seasonNotes: string;
}

export interface CoachStrategy {
  coachId: string;
  name: string;
  role: string;
  gamePlan: string;
  adjustments: string[];
}

export interface MatchEvent {
  clock: string;
  description: string;
  impact: string;
}

export interface MatchMetrics {
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  turnoverRate: number;
  effectiveFieldGoalPercentage: number;
  reboundMargin: string;
  notes: string;
}

export interface MatchDataset {
  teamId: string;
  matchId: string;
  metadata: MatchMetadata;
  playerBios: PlayerBio[];
  coachStrategies: CoachStrategy[];
  events: MatchEvent[];
  metrics: MatchMetrics;
}

function getDataDir() {
  return path.join(process.cwd(), "data", "matches");
}

export async function loadMatchDatasets(): Promise<MatchDataset[]> {
  const dir = getDataDir();
  const entries = await fs.readdir(dir);
  const matches: MatchDataset[] = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(dir, entry), "utf-8");
    const parsed = JSON.parse(raw) as MatchDataset;
    matches.push(parsed);
  }

  return matches.sort((a, b) => a.matchId.localeCompare(b.matchId));
}

export async function loadMatchDataset(matchId: string): Promise<MatchDataset | null> {
  const dir = getDataDir();
  const filePath = path.join(dir, `match-${matchId}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as MatchDataset;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}
