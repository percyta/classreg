import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ระบบจองลงทะเบียนเรียน" },
      { name: "description", content: "จองคาบเรียนคณิตศาสตร์และวิทยาศาสตร์" },
    ],
  }),
  component: Index,
});

type Subject = "math" | "science";
const SUBJECTS: { id: Subject; name: string; emoji: string }[] = [
  { id: "math", name: "คณิตศาสตร์", emoji: "📐" },
  { id: "science", name: "วิทยาศาสตร์", emoji: "🔬" },
];

const DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const SLOTS = [
  { id: "morning", name: "เช้า", time: "08:30 - 11:30" },
  { id: "afternoon", name: "บ่าย", time: "13:00 - 15:00" },
  { id: "evening", name: "เย็น", time: "17:00 - 18:30" },
];
const CAPACITY = 20;

type BookingState = Record<string, { booked: number; mine: boolean }>;

const key = (s: Subject, d: number, slot: string) => `${s}-${d}-${slot}`;

function loadState(): BookingState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("booking-state-v1");
    if (raw) return JSON.parse(raw);
  } catch {}
  // seed with some random occupancy so empty/full states are visible
  const seed: BookingState = {};
  for (const s of SUBJECTS) {
    for (let d = 0; d < DAYS.length; d++) {
      for (const slot of SLOTS) {
        const booked = Math.floor(Math.random() * (CAPACITY + 1));
        seed[key(s.id, d, slot.id)] = { booked, mine: false };
      }
    }
  }
  return seed;
}

function Index() {
  const [subject, setSubject] = useState<Subject>("math");
  const [state, setState] = useState<BookingState>({});
  const [detail, setDetail] = useState<{ d: number; slot: string } | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (Object.keys(state).length)
      localStorage.setItem("booking-state-v1", JSON.stringify(state));
  }, [state]);

  const toggle = (d: number, slot: string) => {
    setState((prev) => {
      const k = key(subject, d, slot);
      const cur = prev[k] ?? { booked: 0, mine: false };
      let next = { ...cur };
      if (cur.mine) {
        next = { booked: Math.max(0, cur.booked - 1), mine: false };
      } else {
        if (cur.booked >= CAPACITY) return prev;
        next = { booked: cur.booked + 1, mine: true };
      }
      return { ...prev, [k]: next };
    });
  };

  const totals = useMemo(() => {
    let free = 0,
      total = 0,
      mine = 0;
    for (let d = 0; d < DAYS.length; d++) {
      for (const slot of SLOTS) {
        const c = state[key(subject, d, slot.id)] ?? { booked: 0, mine: false };
        free += CAPACITY - c.booked;
        total += CAPACITY;
        if (c.mine) mine += 1;
      }
    }
    return { free, total, mine };
  }, [state, subject]);

  const statusOf = (d: number, slot: string) => {
    const c = state[key(subject, d, slot)] ?? { booked: 0, mine: false };
    if (c.mine) return "mine" as const;
    if (c.booked >= CAPACITY) return "full" as const;
    return "free" as const;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ระบบจองลงทะเบียนเรียน
          </h1>
          <p className="mt-2 text-muted-foreground">
            เลือกวิชา แล้วกดช่องเวลาที่ต้องการเพื่อจองหรือยกเลิก
          </p>
        </header>

        {/* Subject tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSubject(s.id);
                setDetail(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                subject === s.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="ที่นั่งทั้งหมด" value={totals.total} />
          <StatCard label="ว่าง" value={totals.free} tone="free" />
          <StatCard label="ถูกจอง" value={totals.total - totals.free} tone="full" />
          <StatCard label="ฉันจองไว้" value={totals.mine} tone="mine" />
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <Legend className="bg-emerald-500" label="ว่าง" />
          <Legend className="bg-rose-500" label="เต็ม" />
          <Legend className="bg-sky-500" label="ที่ฉันจอง" />
        </div>

        {/* Grid */}
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left font-semibold">ช่วงเวลา</th>
                {DAYS.map((d) => (
                  <th key={d} className="p-3 text-center font-semibold">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot.id} className="border-t">
                  <td className="p-3 align-top">
                    <div className="font-medium">{slot.name}</div>
                    <div className="text-xs text-muted-foreground">{slot.time}</div>
                  </td>
                  {DAYS.map((_, d) => {
                    const c = state[key(subject, d, slot.id)] ?? {
                      booked: 0,
                      mine: false,
                    };
                    const status = statusOf(d, slot.id);
                    const color =
                      status === "mine"
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : status === "full"
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white";
                    return (
                      <td key={d} className="p-2">
                        <button
                          onClick={() => toggle(d, slot.id)}
                          className={`flex w-full flex-col items-center justify-center rounded-lg px-2 py-3 font-medium shadow-sm transition ${color}`}
                          title={`${DAYS[d]} ${slot.time}`}
                        >
                          <span className="text-base">
                            {CAPACITY - c.booked}/{CAPACITY}
                          </span>
                          <span className="mt-1 text-[10px] uppercase tracking-wide opacity-90">
                            {status === "mine"
                              ? "จองแล้ว"
                              : status === "full"
                              ? "เต็ม"
                              : "ว่าง"}
                          </span>
                        </button>
                        <button
                          onClick={() => setDetail({ d, slot: slot.id })}
                          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {detail && (
          <DetailPanel
            subject={SUBJECTS.find((s) => s.id === subject)!.name}
            day={DAYS[detail.d]}
            slot={SLOTS.find((s) => s.id === detail.slot)!}
            booked={
              (state[key(subject, detail.d, detail.slot)] ?? { booked: 0 }).booked
            }
            mine={
              (state[key(subject, detail.d, detail.slot)] ?? { mine: false }).mine
            }
            onClose={() => setDetail(null)}
            onToggle={() => toggle(detail.d, detail.slot)}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "free" | "full" | "mine";
}) {
  const color =
    tone === "free"
      ? "text-emerald-600"
      : tone === "full"
      ? "text-rose-600"
      : tone === "mine"
      ? "text-sky-600"
      : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function DetailPanel({
  subject,
  day,
  slot,
  booked,
  mine,
  onClose,
  onToggle,
}: {
  subject: string;
  day: string;
  slot: { name: string; time: string };
  booked: number;
  mine: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const free = CAPACITY - booked;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{subject}</h3>
            <p className="text-sm text-muted-foreground">
              วัน{day} • {slot.name} {slot.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground">ทั้งหมด</div>
            <div className="text-xl font-bold">{CAPACITY}</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
            <div className="text-xs text-emerald-700 dark:text-emerald-400">ว่าง</div>
            <div className="text-xl font-bold text-emerald-600">{free}</div>
          </div>
          <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30">
            <div className="text-xs text-rose-700 dark:text-rose-400">ถูกจอง</div>
            <div className="text-xl font-bold text-rose-600">{booked}</div>
          </div>
        </div>

        <button
          onClick={onToggle}
          disabled={!mine && free === 0}
          className={`mt-5 w-full rounded-lg px-4 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            mine
              ? "bg-sky-500 hover:bg-sky-600"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {mine ? "ยกเลิกการจอง" : free === 0 ? "ที่นั่งเต็ม" : "จองช่วงเวลานี้"}
        </button>
      </div>
    </div>
  );
}
