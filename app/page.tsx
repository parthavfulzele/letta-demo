"use client";
import { useState } from "react";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (e: any) {
      setReply(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
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
    </main>
  );
}