import { Link } from "@tanstack/react-router";
import { LayoutDashboard, BookOpenText, MessagesSquare, CalendarCheck, Menu, Compass } from "lucide-react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/research", label: "Research Assistant", icon: BookOpenText },
  { to: "/chat", label: "AI Chatbot", icon: MessagesSquare },
  { to: "/planner", label: "Task Planner", icon: CalendarCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Compass className="size-5" />
          </span>
          <div>
            <div className="font-display text-lg font-bold leading-none">Waypoint</div>
            <div className="text-xs opacity-70">AI productivity hub</div>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-80 transition hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent !opacity-100 font-semibold text-sidebar-primary" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <p className="absolute bottom-4 px-6 text-xs opacity-60">Data is saved in this browser only.</p>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-foreground/40 md:hidden" onClick={() => setOpen(false)} />}
      <main className="min-w-0 flex-1">
        <div className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-muted">
            <Menu className="size-5" />
          </button>
          <span className="font-display font-bold">Waypoint</span>
        </div>
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-muted-foreground">{sub}</p>
    </div>
  );
}

export function Md({ children }: { children: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function AiBadge({ demo }: { demo?: boolean | undefined }) {
  return demo ? (
    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning-foreground">Demo content</span>
  ) : (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">AI-generated</span>
  );
}
