"use client";
import { useState } from "react";

type MatchAnalysis = {
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
};

type AnalysisResponse =
  | {
      processed: number;
      results: MatchAnalysis[];
    }
  | { error: string };

type RetrievalMatch = {
  matchId: string;
  teamId: string;
  matchDate: string;
  summary: string;
  recommendations: string[];
  riskNotes: string[];
};

type RetrievalResponse =
  | {
      question: string;
      matches: RetrievalMatch[];
      note?: string;
    }
  | { error: string };

export default function HomePage() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [retrievalLoading, setRetrievalLoading] = useState(false);
  const [retrieval, setRetrieval] = useState<RetrievalResponse | null>(null);

  async function send() {
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReply(data.reply);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setReply(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalysisLoading(true);
    setAnalysisResponse(null);
    try {
      const res = await fetch("/api/matches/analyze", {
        method: "POST",
      });
      const data = (await res.json()) as AnalysisResponse;
      if (!res.ok) {
        throw new Error(data.error || "Failed to run analysis");
      }
      setAnalysisResponse(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAnalysisResponse({ error: message });
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function fetchSummaries() {
    setRetrievalLoading(true);
    setRetrieval(null);
    try {
      const res = await fetch("/api/matches/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Summarize last 3 matches" }),
      });
      const data = (await res.json()) as RetrievalResponse;
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch summaries");
      }
      setRetrieval(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setRetrieval({ error: message });
    } finally {
      setRetrievalLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Letta Demo</h1>
      <p className="text-sm opacity-80">
        Type a message and the server will create a Letta agent and reply.
      </p>

      <textarea
        className="w-full h-32 border rounded p-2"
        placeholder="Type your message…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={send}
        disabled={loading}
        className="px-4 py-2 border rounded"
      >
        {loading ? "Sending…" : "Send"}
      </button>

      {reply && (
        <div className="border rounded p-3 whitespace-pre-wrap">
          {reply}
        </div>
      )}

      <section className="space-y-3 border-t pt-6">
        <h2 className="text-xl font-semibold">Match Analysis Worker</h2>
        <p className="text-sm opacity-80">
          Upload Phoenix Rivals match documents to Letta, generate summaries, and persist
          them into Supabase.
        </p>
        <button
          onClick={runAnalysis}
          disabled={analysisLoading}
          className="px-4 py-2 border rounded"
        >
          {analysisLoading ? "Running…" : "Run analyses"}
        </button>
        {analysisResponse && (
          <pre className="border rounded p-3 text-sm whitespace-pre-wrap">
            {JSON.stringify(analysisResponse, null, 2)}
          </pre>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Retrieve Last Three Summaries</h2>
        <p className="text-sm opacity-80">
          Calls the Supabase-backed endpoint with the test prompt
          &ldquo;Summarize last 3 matches.&rdquo;
        </p>
        <button
          onClick={fetchSummaries}
          disabled={retrievalLoading}
          className="px-4 py-2 border rounded"
        >
          {retrievalLoading ? "Loading…" : "Fetch summaries"}
        </button>
        {retrieval && (
          <pre className="border rounded p-3 text-sm whitespace-pre-wrap">
            {JSON.stringify(retrieval, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
