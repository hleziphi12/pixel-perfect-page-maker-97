import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Download, ListPlus, Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiBadge, Md, PageTitle } from "@/components/AppShell";
import { aiGenerate } from "@/lib/ai.functions";
import { addTaskFromText, download, uid, useResearch, useTasks } from "@/lib/store";

export const Route = createFileRoute("/research")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Waypoint" },
      { name: "description", content: "Generate structured research reports with headings, key points and sources." },
      { property: "og:title", content: "AI Research Assistant — Waypoint" },
      { property: "og:description", content: "Structured AI research reports you can copy and download." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const { id } = Route.useSearch();
  const [items, setItems] = useResearch();
  const [, setTasks] = useTasks();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string | undefined>(id);
  const current = items.find((r) => r.id === sel) ?? items[0];

  async function run() {
    if (!q.trim()) return;
    setBusy(true);
    const res = await aiGenerate({ data: { mode: "research", messages: [{ role: "user", content: q }] } });
    if (res.error) toast.warning(res.error);
    const item = { id: uid(), query: q, report: res.text, demo: res.demo, createdAt: Date.now() };
    setItems((p) => [item, ...p].slice(0, 30));
    setSel(item.id);
    setQ("");
    setBusy(false);
  }

  function toTasks() {
    if (!current) return;
    const heads = current.report.split("\n").filter((l) => l.startsWith("## ") && !/sources/i.test(l)).map((l) => l.slice(3));
    const list = (heads.length ? heads : [current.query]).map((h) => addTaskFromText(`Research: ${h}`, current.query));
    setTasks((p) => [...list, ...p]);
    toast.success(`${list.length} task(s) added to your planner`);
  }

  return (
    <>
      <PageTitle title="AI Research Assistant" sub="Get an organised report with key points and sources." />
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mb-6 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Impact of AI on classroom assessment" className="h-11 bg-card" />
        <Button type="submit" disabled={busy || !q.trim()} className="h-11">
          {busy ? <Loader2 className="animate-spin" /> : <Search />} Research
        </Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-1">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">History</div>
          {items.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
          {items.map((r) => (
            <div key={r.id} className={`group flex items-center rounded-lg text-sm ${current?.id === r.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
              <button onClick={() => setSel(r.id)} className="flex-1 truncate px-3 py-2 text-left">{r.query}</button>
              <button aria-label="Delete report" onClick={() => setItems((p) => p.filter((x) => x.id !== r.id))} className="p-2 opacity-0 group-hover:opacity-100">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </aside>
        <article className="rounded-xl border bg-card p-6 shadow-card">
          {busy ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Researching…</div>
          ) : current ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <AiBadge demo={current.demo} />
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(current.report); toast.success("Copied"); }}><Copy /> Copy</Button>
                  <Button size="sm" variant="outline" onClick={() => download(`research-${current.id}.md`, current.report)}><Download /> Download</Button>
                  <Button size="sm" onClick={toTasks}><ListPlus /> Convert to tasks</Button>
                </div>
              </div>
              <Md>{current.report}</Md>
              <p className="mt-6 text-xs text-muted-foreground">AI-generated information may contain errors. Verify sources before citing.</p>
            </>
          ) : (
            <p className="text-muted-foreground">Enter a topic above to generate your first report.</p>
          )}
        </article>
      </div>
    </>
  );
}
