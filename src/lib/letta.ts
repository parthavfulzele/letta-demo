import { LettaClient } from "@letta-ai/letta-client";

export function createLettaClient() {
  const apiKey = process.env.LETTA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing LETTA_API_KEY env var");
  }

  const baseUrl = process.env.LETTA_BASE_URL;

  return new LettaClient({
    apiKey,
    token: apiKey,
    baseUrl,
  });
}
