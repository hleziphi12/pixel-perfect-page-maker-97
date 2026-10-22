import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, MessagesSquare, CalendarCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageTitle } from "@/components/AppShell";
import { useTasks, useResearch, isOverdue } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Waypoint AI Productivity Hub" },
      { name: "description", content: "See your tasks, deadlines, progress and recent research at a glance." },
      { property: "og:title", content: "Waypoint Dashboard" },
      { property: "og:description", content: "Tasks, deadlines, progress and research in one place." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [tasks] = useTasks();
  const [research] = useResearch();
  const done = tasks.filter((t) => t.done).length;
  const overdue = tasks.filter((t) => isOverdue(t));
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks
    .filter((t) => !t.done)
    .sort((a, b) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`))
    .slice(0, 5);

  const tools = [
    { to: "/research", icon: BookOpenText, title: "Research Assistant", text: "Structured reports with sources." },
    { to: "/chat", icon: MessagesSquare, title: "AI Chatbot", text: "Ask, explain, follow up." },
    { to: "/planner", icon: CalendarCheck, title: "Task Planner", text: "Tasks, calendar & AI schedules." },
  ] as const;

  return (
    <>
      <section className="bg-hero mb-8 rounded-2xl p-8 text-primary-foreground shadow-card">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Research, ask, plan — in one place.</h1>
        <p className="mt-2 max-w-xl opacity-85">Your AI workspace for study, teaching and work. Everything stays in this browser.</p>
      </section>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.to} to={t.to} className="group rounded-xl border bg-card p-5 shadow-card transition hover:border-teal">
            <t.icon className="size-6 text-teal" />
            <div className="mt-3 font-display font-bold">{t.title}</div>
            <div className="text-sm text-muted-foreground">{t.text}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <PageTitle title="Progress" sub={`${done} of ${tasks.length} tasks complete`} />
          <Progress value={pct} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <Stat icon={CheckCircle2} n={done} label="Done" />
            <Stat icon={Clock} n={tasks.length - done} label="Open" />
            <Stat icon={AlertTriangle} n={overdue.length} label="Overdue" danger={overdue.length > 0} />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Upcoming deadlines</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tasks. <Link to="/planner" className="text-teal underline">Add one</Link></p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex justify-between gap-2 text-sm">
                  <span className={isOverdue(t) ? "text-destructive" : ""}>{t.title}</span>
                  <span className="shrink-0 text-muted-foreground">{t.date} {t.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold">Recent research</h2>
          {research.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet. <Link to="/research" className="text-teal underline">Start researching</Link></p>
          ) : (
            <ul className="space-y-2">
              {research.slice(0, 5).map((r) => (
                <li key={r.id} className="truncate text-sm">
                  <Link to="/research" search={{ id: r.id }} className="hover:text-teal">{r.query}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon: I, n, label, danger }: { icon: typeof Clock; n: number; label: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg bg-secondary p-2 ${danger ? "text-destructive" : ""}`}>
      <I className="mx-auto size-4" />
      <div className="font-display text-xl font-bold">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
