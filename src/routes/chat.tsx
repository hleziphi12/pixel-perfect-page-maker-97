import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Compass, ListPlus, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiBadge, Md, PageTitle } from "@/components/AppShell";
import { aiGenerate } from "@/lib/ai.functions";
import { addTaskFromText, useChat, useTasks, type ChatMsg } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Waypoint" },
      { name: "description", content: "Ask questions, get step-by-step explanations, examples and summaries." },
      { property: "og:title", content: "AI Chatbot — Waypoint" },
      { property: "og:description", content: "A friendly AI tutor that remembers your conversation." },
    ],
  }),
  component: ChatPage,
});

const starters = ["Explain recursion with an example", "Give me a step-by-step plan to learn SQL", "Summarise the water cycle for Grade 7"];

function ChatPage() {
  const [msgs, setMsgs] = useChat();
  const [, setTasks] = useTasks();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (!busy) ta.current?.focus(); }, [busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const history: ChatMsg[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    setInput("");
    setBusy(true);
    const res = await aiGenerate({ data: { mode: "chat", messages: history.slice(-40).map(({ role, content }) => ({ role, content })) } });
    if (res.error) toast.warning(res.error);
    setMsgs((p) => [...p, { role: "assistant", content: res.text, demo: res.demo }]);
    setBusy(false);
  }

  function toTask(m: ChatMsg) {
    const steps = m.content.split("\n").filter((l) => /^\s*(\d+\.|[-*])\s+/.test(l)).map((l) => l.replace(/^\s*(\d+\.|[-*])\s+/, "").replace(/\*\*/g, ""));
    const list = (steps.length ? steps.slice(0, 10) : [m.content.slice(0, 100)]).map((s) => addTaskFromText(s, "From chatbot"));
    setTasks((p) => [...list, ...p]);
    toast.success(`${list.length} task(s) added to your planner`);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-start justify-between">
        <PageTitle title="AI Chatbot" sub="Ask anything — follow-up questions remember the conversation." />
        {msgs.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setMsgs([])}><RotateCcw /> New conversation</Button>
        )}
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto rounded-xl border bg-card p-4 shadow-card md:p-6">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Compass className="size-10 text-teal" />
            <p className="text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {starters.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>{s}</Button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{m.content}</div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Compass className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <Md>{m.content}</Md>
                <div className="mt-2 flex items-center gap-2">
                  <AiBadge demo={m.demo} />
                  <Button variant="ghost" size="sm" onClick={() => toTask(m)}><ListPlus /> Make tasks</Button>
                </div>
              </div>
            </div>
          ),
        )}
        {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex items-end gap-2">
        <Textarea
          ref={ta}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Type your question… (Shift+Enter for a new line)"
          className="min-h-12 resize-none bg-card"
          rows={1}
        />
        <Button type="submit" size="icon" className="size-12 shrink-0" disabled={busy || !input.trim()} aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}
