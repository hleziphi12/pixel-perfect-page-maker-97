import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, List, Loader2, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiBadge, Md, PageTitle } from "@/components/AppShell";
import { aiGenerate } from "@/lib/ai.functions";
import { isOverdue, today, uid, useTasks, type Priority, type Task } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler — Waypoint" },
      { name: "description", content: "Create tasks with priorities and deadlines, track progress and generate AI schedules." },
      { property: "og:title", content: "AI Task Planner — Waypoint" },
      { property: "og:description", content: "Plan tasks and let AI build your daily or weekly schedule." },
    ],
  }),
  component: Planner,
});

const prioClass: Record<Priority, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/20 text-warning-foreground",
  low: "bg-accent text-accent-foreground",
};
const blank = (): Task => ({ id: "", title: "", priority: "medium", date: today(), time: "", done: false, createdAt: 0 });
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Planner() {
  const [tasks, setTasks] = useTasks();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filter, setFilter] = useState<"all" | "open" | "done" | "overdue">("all");
  const [edit, setEdit] = useState<Task | null>(null);
  const [day, setDay] = useState<Date | undefined>(new Date());
  const [sched, setSched] = useState<{ text: string; demo: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...tasks]
        .filter((t) => (filter === "all" ? true : filter === "open" ? !t.done : filter === "done" ? t.done : isOverdue(t)))
        .sort((a, b) => Number(a.done) - Number(b.done) || `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [tasks, filter],
  );
  const done = tasks.filter((t) => t.done).length;

  function save() {
    if (!edit || !edit.title.trim()) { toast.error("Please enter a title"); return; }
    if (edit.id) setTasks((p) => p.map((t) => (t.id === edit.id ? edit : t)));
    else setTasks((p) => [{ ...edit, id: uid(), createdAt: Date.now() }, ...p]);
    setEdit(null);
  }

  async function plan(kind: "daily" | "weekly") {
    const open = tasks.filter((t) => !t.done).map(({ title, priority, date, time }) => ({ title, priority, due: `${date} ${time ?? ""}`.trim(), overdue: isOverdue({ date, time } as Task) }));
    if (!open.length) { toast.info("Add some open tasks first"); return; }
    setBusy(kind);
    const res = await aiGenerate({ data: { mode: "schedule", messages: [{ role: "user", content: `Create a ${kind} schedule. Today is ${new Date().toDateString()}. Tasks: ${JSON.stringify(open)}` }] } });
    if (res.error) toast.warning(res.error);
    setSched({ text: res.text, demo: res.demo });
    setBusy(null);
  }

  const dayTasks = day ? tasks.filter((t) => t.date === fmt(day)) : [];
  const taskDates = tasks.map((t) => new Date(`${t.date}T12:00`));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="AI Task Planner" sub={`${done}/${tasks.length} complete · ${tasks.filter((t) => isOverdue(t)).length} overdue`} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => plan("daily")} disabled={!!busy}>{busy === "daily" ? <Loader2 className="animate-spin" /> : <Wand2 />} Daily plan</Button>
          <Button variant="outline" onClick={() => plan("weekly")} disabled={!!busy}>{busy === "weekly" ? <Loader2 className="animate-spin" /> : <Wand2 />} Weekly plan</Button>
          <Button onClick={() => setEdit(blank())}><Plus /> New task</Button>
        </div>
      </div>

      {sched && (
        <div className="mb-6 rounded-xl border border-teal/40 bg-card p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2"><h2 className="font-display font-bold">Your AI schedule</h2><AiBadge demo={sched.demo} /><Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSched(null)}>Close</Button></div>
          <Md>{sched.text}</Md>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-card p-1">
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List /> List</Button>
          <Button size="sm" variant={view === "calendar" ? "default" : "ghost"} onClick={() => setView("calendar")}><CalendarDays /> Calendar</Button>
        </div>
        {view === "list" && (["all", "open", "done", "overdue"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "secondary" : "ghost"} onClick={() => setFilter(f)} className="capitalize">{f}</Button>
        ))}
      </div>

      {view === "list" ? (
        <TaskList tasks={sorted} setTasks={setTasks} onEdit={setEdit} />
      ) : (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="rounded-xl border bg-card p-2 shadow-card">
            <Calendar mode="single" selected={day} onSelect={setDay} modifiers={{ has: taskDates }} modifiersClassNames={{ has: "font-bold text-teal underline" }} />
          </div>
          <div>
            <h3 className="mb-2 font-display font-bold">{day?.toDateString()}</h3>
            {dayTasks.length ? <TaskList tasks={dayTasks} setTasks={setTasks} onEdit={setEdit} /> : <p className="text-sm text-muted-foreground">No tasks this day.</p>}
          </div>
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <Input placeholder="Task title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} autoFocus />
              <Input placeholder="Notes (optional)" value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Select value={edit.priority} onValueChange={(v) => setEdit({ ...edit, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                </Select>
                <Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                <Input type="time" value={edit.time ?? ""} onChange={(e) => setEdit({ ...edit, time: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TaskList({ tasks, setTasks, onEdit }: { tasks: Task[]; setTasks: (u: (p: Task[]) => Task[]) => void; onEdit: (t: Task) => void }) {
  if (!tasks.length) return <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">No tasks here.</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => {
        const od = isOverdue(t);
        return (
          <li key={t.id} className={`flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card ${od ? "border-destructive/50" : ""}`}>
            <Checkbox checked={t.done} onCheckedChange={() => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} aria-label="Complete task" />
            <div className="min-w-0 flex-1">
              <div className={`truncate font-medium ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={`rounded-full px-2 py-0.5 font-medium capitalize ${prioClass[t.priority]}`}>{t.priority}</span>
                <span>{t.date} {t.time}</span>
                {od && <span className="font-semibold text-destructive">Overdue</span>}
                {t.notes && <span className="truncate">· {t.notes}</span>}
              </div>
            </div>
            <Button size="icon" variant="ghost" aria-label="Edit task" onClick={() => onEdit(t)}><Pencil /></Button>
            <Button size="icon" variant="ghost" aria-label="Delete task" onClick={() => setTasks((p) => p.filter((x) => x.id !== t.id))}><Trash2 /></Button>
          </li>
        );
      })}
    </ul>
  );
}
