type Status = "pending" | "success" | "error";
type Entry = { status: Status; message?: string; data?: any; updatedAt: number };

const g = globalThis as any;
if (!g.__webhookStore) {
  g.__webhookStore = new Map<string, Entry>();
}

export function createPending(id: string, data?: any) {
  g.__webhookStore.set(id, { status: "pending", data, updatedAt: Date.now() });
}

export function setStatus(id: string, entry: { status: Status; message?: string; data?: any }) {
  const next: Entry = { ...entry, updatedAt: Date.now() };
  g.__webhookStore.set(id, next);
}

export function getStatus(id: string): Entry | undefined {
  return g.__webhookStore.get(id);
}

export function cleanup(ttlMs = 60 * 60 * 1000) {
  const now = Date.now();
  for (const [id, entry] of g.__webhookStore.entries()) {
    if (now - entry.updatedAt > ttlMs) {
      g.__webhookStore.delete(id);
    }
  }
}