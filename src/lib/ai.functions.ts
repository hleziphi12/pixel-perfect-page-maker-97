import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  mode: z.enum(["research", "chat", "schedule"]),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
    .min(1)
    .max(60),
});

const SYSTEM: Record<string, string> = {
  research:
    "You are a research assistant. Produce a well-structured markdown research report: a title (#), an Executive Summary, several ## sections with bullet key points, a ## Key Takeaways list, and a ## Sources section listing reputable sources as markdown links (only real, well-known URLs such as Wikipedia, government, university or major organisation pages; say 'verify before citing'). Be accurate and concise.",
  chat:
    "You are a friendly, expert tutor and assistant for students, teachers, IT facilitators and professionals. Explain clearly using markdown, step-by-step guidance, examples and short summaries when useful.",
  schedule:
    "You are a productivity planner. Given a task list (JSON) and today's date, produce a realistic markdown schedule. Prioritise overdue and high-priority tasks, include time blocks (e.g. 09:00–10:00), breaks, and a short tips section. Use tables or bullet lists.",
};

export const aiGenerate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { text: demo(data.mode, data.messages.at(-1)!.content), demo: true, error: null };
    try {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const { streamText } = await import("ai");
      const provider = createOpenAI({
        baseURL: "https://ai.gateway.lovable.dev/v1",
        apiKey,
        headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      });
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system: SYSTEM[data.mode] ?? "",
        messages: data.messages,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = await result.text;
      if (!text.trim()) throw new Error("The AI returned an empty response.");
      return { text, demo: false, error: null };
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      const status = e?.statusCode ?? e?.status;
      const reason =
        status === 402
          ? "AI credits are used up — showing demo content."
          : status === 429
            ? "AI is busy (rate limited) — showing demo content. Try again shortly."
            : `AI unavailable (${msg.slice(0, 120)}) — showing demo content.`;
      return { text: demo(data.mode, data.messages.at(-1)!.content), demo: true, error: reason };
    }
  });

function demo(mode: string, prompt: string) {
  const topic = prompt.slice(0, 80);
  if (mode === "research")
    return `# Research: ${topic}\n\n> **Demo mode** — sample content, not real AI output.\n\n## Executive Summary\n${topic} is an important subject with practical implications across education and industry.\n\n## Background\n- Origins and definitions\n- Key concepts and terminology\n\n## Current Trends\n- Growing adoption in organisations\n- Increasing focus on ethics and accessibility\n\n## Key Takeaways\n- Start with fundamentals\n- Compare multiple sources\n\n## Sources\n- [Wikipedia](https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)})\n- [Google Scholar](https://scholar.google.com/scholar?q=${encodeURIComponent(topic)})`;
  if (mode === "schedule")
    return `> **Demo mode** — sample schedule.\n\n| Time | Activity |\n|---|---|\n| 08:00–09:00 | Review overdue tasks |\n| 09:00–11:00 | Deep work on high-priority task |\n| 11:00–11:15 | Break |\n| 11:15–13:00 | Medium-priority tasks |\n| 14:00–16:00 | Low-priority & admin |\n\n**Tip:** tackle the hardest task first.`;
  return `> **Demo mode** — sample reply.\n\nGreat question about **${topic}**. Here's a simple approach:\n\n1. Define the problem clearly.\n2. Break it into smaller steps.\n3. Try an example and review the result.\n\n**Summary:** practice step by step.`;
}
