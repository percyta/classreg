import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "จองคาบเรียน — ClassReg" },
      { name: "description", content: "จองคาบเรียนคณิตศาสตร์และวิทยาศาสตร์ แบบ real-time" },
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
] as const;
type SlotId = (typeof SLOTS)[number]["id"];
const CAPACITY = 20;

type Booking = {
  id: string;
  subject: Subject;
  day_index: number;
  slot: SlotId;
  nickname: string;
  class_name: string;
  owner_token: string;
  created_at: string;
};

function getOwnerToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("booking-owner-token");
  if (!t) {
    t = crypto.randomUUID() + "-" + crypto.randomUUID();
    localStorage.setItem("booking-owner-token", t);
  }
  return t;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getProfile(): { nickname: string; className: string } {
  if (typeof window === "undefined") return { nickname: "", className: "" };
  try {
    const raw = localStorage.getItem("booking-profile");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nickname: "", className: "" };
}

function Index() {
  
  const [subject, setSubject] = useState<Subject>("math");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ d: number; slot: SlotId } | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ d: number; slot: SlotId } | null>(null);
  const [token, setToken] = useState("");
  const [tokenHash, setTokenHash] = useState("");

  useEffect(() => {
    const t = getOwnerToken();
    setToken(t);
    void sha256Hex(t).then(setTokenHash);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setBookings(data as Booking[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          setBookings((prev) => {
            if (payload.eventType === "INSERT") {
              const row = payload.new as Booking;
              if (prev.some((b) => b.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as Booking;
              return prev.filter((b) => b.id !== row.id);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as Booking;
              return prev.map((b) => (b.id === row.id ? row : b));
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const grid = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const k = `${b.subject}-${b.day_index}-${b.slot}`;
      const arr = map.get(k) ?? [];
      arr.push(b);
      map.set(k, arr);
    }
    return map;
  }, [bookings]);

  const cellOf = (d: number, slot: SlotId) =>
    grid.get(`${subject}-${d}-${slot}`) ?? [];

  const totals = useMemo(() => {
    let booked = 0;
    let mine = 0;
    const total = DAYS.length * SLOTS.length * CAPACITY;
    for (let d = 0; d < DAYS.length; d++) {
      for (const slot of SLOTS) {
        const arr = cellOf(d, slot.id);
        booked += arr.length;
        if (tokenHash) mine += arr.filter((b) => b.owner_token === tokenHash).length;
      }
    }
    return { total, booked, free: total - booked, mine };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, subject, tokenHash]);

  const statusOf = (d: number, slot: SlotId) => {
    const arr = cellOf(d, slot);
    if (tokenHash && arr.some((b) => b.owner_token === tokenHash)) return "mine" as const;
    if (arr.length >= CAPACITY) return "full" as const;
    return "free" as const;
  };

  const handleCellClick = (d: number, slot: SlotId) => {
    const arr = cellOf(d, slot);
    const myBooking = tokenHash ? arr.find((b) => b.owner_token === tokenHash) : undefined;
    if (myBooking) {
      // cancel
      void cancelBooking(myBooking.id);
      return;
    }
    if (arr.length >= CAPACITY) return;
    setBookingTarget({ d, slot });
  };

  async function cancelBooking(id: string) {
    // optimistic
    setBookings((prev) => prev.filter((b) => b.id !== id));
    const { data, error } = await supabase.rpc("cancel_booking", {
      p_id: id,
      p_token: token,
    });
    if (error || data === false) {
      // refetch on failure
      const { data: fresh } = await supabase.from("bookings").select("*");
      if (fresh) setBookings(fresh as Booking[]);
      alert("ยกเลิกไม่สำเร็จ");
    }
  }

  async function submitBooking(nickname: string, className: string) {
    if (!bookingTarget) return;
    const arr = cellOf(bookingTarget.d, bookingTarget.slot);
    if (arr.length >= CAPACITY) {
      alert("ที่นั่งเต็มแล้ว");
      setBookingTarget(null);
      return;
    }
    if (tokenHash && arr.some((b) => b.owner_token === tokenHash)) {
      alert("คุณจองช่วงเวลานี้แล้ว");
      setBookingTarget(null);
      return;
    }
    localStorage.setItem(
      "booking-profile",
      JSON.stringify({ nickname, className }),
    );
    const hash = tokenHash || (await sha256Hex(token));
    const { error } = await supabase.from("bookings").insert({
      subject,
      day_index: bookingTarget.d,
      slot: bookingTarget.slot,
      nickname,
      class_name: className,
      owner_token: hash,
    });
    if (error) {
      alert("จองไม่สำเร็จ: " + error.message);
      return;
    }
    setBookingTarget(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* soft hero gradient */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[280px] opacity-[0.06]" style={{ background: "var(--gradient-hero)" }} />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live — อัปเดต real-time
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">จองคาบเรียน</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              เลือกวิชา แล้วกดที่ช่องว่างเพื่อจอง
            </p>
          </div>

          {/* Segmented subject tabs */}
          <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-[var(--shadow-card)]">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSubject(s.id);
                  setDetail(null);
                }}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition ${
                  subject === s.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-1.5">{s.emoji}</span>
                {s.name}
              </button>
            ))}
          </div>
        </header>

        {/* Stats — slim row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="ที่นั่งทั้งหมด" value={totals.total} icon="◇" />
          <StatCard label="ว่าง" value={totals.free} tone="free" icon="○" />
          <StatCard label="ถูกจอง" value={totals.booked} tone="full" icon="●" />
          <StatCard label="ฉันจองไว้" value={totals.mine} tone="mine" icon="✓" />
        </div>

        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Legend variant="free" label="ว่าง" />
          <Legend variant="mine" label="ที่ฉันจอง (กดเพื่อยกเลิก)" />
          <Legend variant="full" label="เต็ม" />
        </div>

        {/* Schedule — card-based grid */}
        <div className="space-y-5">
          {SLOTS.map((slot) => (
            <section key={slot.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-semibold">{slot.name}</h2>
                  <span className="text-sm text-muted-foreground">{slot.time}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                {DAYS.map((dayName, d) => {
                  const arr = cellOf(d, slot.id);
                  const status = statusOf(d, slot.id);
                  const free = CAPACITY - arr.length;
                  const pct = (arr.length / CAPACITY) * 100;

                  const base =
                    "group relative flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed";
                  const styles =
                    status === "mine"
                      ? "border-primary bg-primary/10 hover:bg-primary/15"
                      : status === "full"
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-border bg-background hover:border-primary hover:shadow-[var(--shadow-card)]";

                  return (
                    <div key={d} className="relative">
                      <button
                        onClick={() => handleCellClick(d, slot.id)}
                        disabled={loading || (status === "full")}
                        className={`${base} ${styles}`}
                        title={`${dayName} ${slot.time}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {dayName}
                          </span>
                          {status === "mine" && (
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                              ✓
                            </span>
                          )}
                          {status === "full" && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              เต็ม
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${status === "mine" ? "text-primary" : status === "full" ? "text-muted-foreground" : "text-foreground"}`}>
                            {free}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {CAPACITY}</span>
                        </div>

                        {/* progress bar */}
                        <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === "mine"
                                ? "bg-primary"
                                : status === "full"
                                  ? "bg-muted-foreground/40"
                                  : "bg-primary/70"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>

                      <button
                        onClick={() => setDetail({ d, slot: slot.id })}
                        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-xs text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
                        aria-label="ดูรายละเอียด"
                        title="ดูรายละเอียด"
                      >
                        ⋯
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {detail && (
          <DetailPanel
            subject={SUBJECTS.find((s) => s.id === subject)!.name}
            day={DAYS[detail.d]}
            slot={SLOTS.find((s) => s.id === detail.slot)!}
            bookings={cellOf(detail.d, detail.slot)}
            myToken={tokenHash}
            onClose={() => setDetail(null)}
            onCancel={(id) => cancelBooking(id)}
            onBook={() => {
              setBookingTarget(detail);
              setDetail(null);
            }}
          />
        )}

        {bookingTarget && (
          <BookingModal
            subject={SUBJECTS.find((s) => s.id === subject)!.name}
            day={DAYS[bookingTarget.d]}
            slot={SLOTS.find((s) => s.id === bookingTarget.slot)!}
            onClose={() => setBookingTarget(null)}
            onSubmit={submitBooking}
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
  icon,
}: {
  label: string;
  value: number;
  tone?: "free" | "full" | "mine";
  icon?: string;
}) {
  const color =
    tone === "free"
      ? "text-primary"
      : tone === "mine"
        ? "text-primary"
        : "text-foreground";
  const iconBg =
    tone === "free" || tone === "mine"
      ? "bg-primary/10 text-primary"
      : tone === "full"
        ? "bg-muted text-muted-foreground"
        : "bg-secondary text-secondary-foreground";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold ${iconBg}`}>
        {icon ?? "·"}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-bold leading-tight ${color}`}>{value}</div>
      </div>
    </div>
  );
}

function Legend({ variant, label }: { variant: "free" | "mine" | "full"; label: string }) {
  const cls =
    variant === "free"
      ? "border border-border bg-background"
      : variant === "mine"
        ? "border border-primary bg-primary/15"
        : "border border-border bg-muted";
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3.5 w-3.5 rounded ${cls}`} />
      <span>{label}</span>
    </div>
  );
}

function DetailPanel({
  subject,
  day,
  slot,
  bookings,
  myToken,
  onClose,
  onCancel,
  onBook,
}: {
  subject: string;
  day: string;
  slot: { name: string; time: string };
  bookings: Booking[];
  myToken: string;
  onClose: () => void;
  onCancel: (id: string) => void;
  onBook: () => void;
}) {
  const free = CAPACITY - bookings.length;
  const mine = bookings.find((b) => b.owner_token === myToken);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{subject}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              วัน{day} • {slot.name} {slot.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ทั้งหมด</div>
            <div className="mt-1 text-xl font-bold">{CAPACITY}</div>
          </div>
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-primary">ว่าง</div>
            <div className="mt-1 text-xl font-bold text-primary">{free}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ถูกจอง</div>
            <div className="mt-1 text-xl font-bold text-foreground">{bookings.length}</div>
          </div>
        </div>

        <div className="mt-5 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border bg-background p-2 text-sm">
          {bookings.length === 0 && (
            <div className="px-2 py-6 text-center text-muted-foreground">
              ยังไม่มีผู้จอง
            </div>
          )}
          {bookings.map((b) => {
            const isMine = b.owner_token === myToken;
            return (
              <div
                key={b.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  isMine ? "bg-primary/10" : "hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {b.nickname.slice(0, 1)}
                  </span>
                  <span>
                    <span className="font-medium">{b.nickname}</span>{" "}
                    <span className="text-muted-foreground">· {b.class_name}</span>
                    {isMine && (
                      <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        คุณ
                      </span>
                    )}
                  </span>
                </span>
                {isMine && (
                  <button
                    onClick={() => onCancel(b.id)}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {mine ? (
          <button
            onClick={() => onCancel(mine.id)}
            className="mt-5 w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 font-semibold text-destructive transition hover:bg-destructive/10"
          >
            ยกเลิกการจองของฉัน
          </button>
        ) : (
          <button
            onClick={onBook}
            disabled={free === 0}
            className="mt-5 w-full rounded-xl px-4 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            style={{ background: "var(--gradient-hero)" }}
          >
            {free === 0 ? "ที่นั่งเต็ม" : "จองช่วงเวลานี้"}
          </button>
        )}
      </div>
    </div>
  );
}

function BookingModal({
  subject,
  day,
  slot,
  onClose,
  onSubmit,
}: {
  subject: string;
  day: string;
  slot: { name: string; time: string };
  onClose: () => void;
  onSubmit: (nickname: string, className: string) => void;
}) {
  const saved = getProfile();
  const [nickname, setNickname] = useState(saved.nickname);
  const [className, setClassName] = useState(saved.className);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = nickname.trim();
    const c = className.trim();
    if (!n || !c) return;
    if (n.length > 40 || c.length > 40) {
      alert("ชื่อเล่นและชั้นเรียนต้องไม่เกิน 40 ตัวอักษร");
      return;
    }
    setSubmitting(true);
    await onSubmit(n, c);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-glow)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">จอง {subject}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              วัน{day} • {slot.name} {slot.time}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">ชื่อเล่น</span>
            <input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              required
              placeholder="เช่น ต๊ะ"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ชั้นเรียน</span>
            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              maxLength={40}
              required
              placeholder="เช่น 3/8"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl px-4 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--gradient-hero)" }}
        >
          {submitting ? "กำลังจอง..." : "ยืนยันการจอง"}
        </button>
      </form>
    </div>
  );
}

