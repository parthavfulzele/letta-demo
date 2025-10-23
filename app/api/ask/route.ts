import { NextRequest, NextResponse } from "next/server";
import { LettaClient } from "@letta-ai/letta-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const key = process.env.LETTA_API_KEY;
    if (!key) {
      throw new Error("Missing LETTA_API_KEY (check .env.local)");
    }

    const client = new LettaClient({
      // Some SDK versions use `apiKey`, some examples show `token`.
      // Supplying both avoids mismatch issues.
      apiKey: key,
      token: key,
      // baseUrl: "http://localhost:8283", // only if you self-host Letta
    });

    const agent = await client.agents.create({
      name: "letta-demo-agent",
      model: "openai/gpt-4o-mini",
      embedding: "openai/text-embedding-3-small",
      system: "You are a concise, friendly demo assistant.",
    });

    const turn = await client.agents.messages.create(agent.id, {
      messages: [{ role: "user", content: message || "Say hello!" }],
    });

    const last = [...turn.messages].reverse()
      .find(m => (m as any).messageType === "assistant_message");
    const text = (last && typeof (last as any).content === "string")
      ? (last as any).content
      : "No reply.";

    return NextResponse.json({ agentId: agent.id, reply: text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}