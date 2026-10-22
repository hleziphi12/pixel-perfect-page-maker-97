import { useEffect, useState, useCallback } from "react";

export type Priority = "high" | "medium" | "low";
export type Task = {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  date: string; // yyyy-mm-dd
  time?: string; // HH:mm
  done: boolean;
  createdAt: number;
};
export type Research = { id: string; query: string; report: string; demo: boolean; createdAt: number };
export type ChatMsg = { role: "user" | "assistant"; content: string; demo?: boolean };

const listeners = new Map<string, Set<() => void>>();

export function useLocal<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(key);
        setVal(raw ? JSON.parse(raw) : initial);
      } catch {
        setVal(initial);
      }
    };
    read();
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(read);
    return () => void listeners.get(key)!.delete(read);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (updater: T | ((p: T) => T)) => {
      const prevRaw = localStorage.getItem(key);
      const prev = prevRaw ? (JSON.parse(prevRaw) as T) : initial;
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      localStorage.setItem(key, JSON.stringify(next));
      listeners.get(key)?.forEach((l) => l());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [val, set] as const;
}

export const useTasks = () => useLocal<Task[]>("aiw.tasks", []);
export const useResearch = () => useLocal<Research[]>("aiw.research", []);
export const useChat = () => useLocal<ChatMsg[]>("aiw.chat", []);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);

export function isOverdue(t: Task, now = new Date()) {
  if (t.done) return false;
  const due = new Date(`${t.date}T${t.time || "23:59"}`);
  return due.getTime() < now.getTime();
}

export function addTaskFromText(title: string, notes?: string): Task {
  return { id: uid(), title: title.slice(0, 140), notes, priority: "medium", date: today(), done: false, createdAt: Date.now() };
}

export function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
