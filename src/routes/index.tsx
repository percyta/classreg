import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ระบบจองลงทะเบียนเรียน" },
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
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
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

function getProfile(): { nickname: string; className: string } {
  if (typeof window === "undefined") return { nickname: "", className: "" };
  try {
    const raw = localStorage.getItem("booking-profile");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { nickname: "", className: "" };
}

function Index() {
  const [view, setView] = useState<"booking" | "api">("booking");
  const [subject, setSubject] = useState<Subject>("math");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<{ d: number; slot: SlotId } | null>(null);
  const [bookingTarget, setBookingTarget] = useState<{ d: number; slot: SlotId } | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getOwnerToken());
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
        if (token) mine += arr.filter((b) => b.owner_token === token).length;
      }
    }
    return { total, booked, free: total - booked, mine };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, subject, token]);

  const statusOf = (d: number, slot: SlotId) => {
    const arr = cellOf(d, slot);
    if (token && arr.some((b) => b.owner_token === token)) return "mine" as const;
    if (arr.length >= CAPACITY) return "full" as const;
    return "free" as const;
  };

  const handleCellClick = (d: number, slot: SlotId) => {
    const arr = cellOf(d, slot);
    const myBooking = token ? arr.find((b) => b.owner_token === token) : undefined;
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
    if (token && arr.some((b) => b.owner_token === token)) {
      alert("คุณจองช่วงเวลานี้แล้ว");
      setBookingTarget(null);
      return;
    }
    localStorage.setItem(
      "booking-profile",
      JSON.stringify({ nickname, className }),
    );
    const { error } = await supabase.from("bookings").insert({
      subject,
      day_index: bookingTarget.d,
      slot: bookingTarget.slot,
      nickname,
      class_name: className,
      owner_token: token,
    });
    if (error) {
      alert("จองไม่สำเร็จ: " + error.message);
      return;
    }
    setBookingTarget(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              ระบบจองลงทะเบียนเรียน
            </h1>
            <p className="mt-2 text-muted-foreground">
              กดช่องที่ว่างเพื่อจอง • ข้อมูลซิงค์แบบ real-time ทุกคนเห็นเหมือนกัน
            </p>
          </div>
          <span className="hidden rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground sm:inline">
            🟢 Live
          </span>
        </header>

        {/* View tabs */}
        <div className="mb-6 inline-flex rounded-full border bg-card p-1">
          {([
            { id: "booking", label: "📅 จองคาบเรียน" },
            { id: "api", label: "🔌 API Docs" },
          ] as const).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                view === v.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === "api" ? (
          <ApiDocs />
        ) : (
        <>
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
          <StatCard label="ถูกจอง" value={totals.booked} tone="full" />
          <StatCard label="ฉันจองไว้" value={totals.mine} tone="mine" />
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <Legend className="bg-emerald-500" label="ว่าง" />
          <Legend className="bg-rose-500" label="เต็ม" />
          <Legend className="bg-sky-500" label="ที่ฉันจอง (กดเพื่อยกเลิก)" />
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
                    const arr = cellOf(d, slot.id);
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
                          onClick={() => handleCellClick(d, slot.id)}
                          disabled={loading}
                          className={`flex w-full flex-col items-center justify-center rounded-lg px-2 py-3 font-medium shadow-sm transition disabled:opacity-50 ${color}`}
                          title={`${DAYS[d]} ${slot.time}`}
                        >
                          <span className="text-base">
                            {CAPACITY - arr.length}/{CAPACITY}
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

        {detail && (
          <DetailPanel
            subject={SUBJECTS.find((s) => s.id === subject)!.name}
            day={DAYS[detail.d]}
            slot={SLOTS.find((s) => s.id === detail.slot)!}
            bookings={cellOf(detail.d, detail.slot)}
            myToken={token}
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
        </>
        )}
      </div>
    </div>
  );
}

function ApiDocs() {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const endpoint = `${base}/api/public/bookings`;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-xl font-bold">API สำหรับเชื่อมระบบอื่น</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Base URL:{" "}
          <code className="rounded bg-muted px-2 py-0.5 text-xs">{endpoint}</code>
        </p>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="font-semibold text-foreground">subject:</span> math | science
          </div>
          <div>
            <span className="font-semibold text-foreground">day:</span> mon | tue | wed | thu | fri | sat | sun
          </div>
          <div>
            <span className="font-semibold text-foreground">slot:</span> morning | afternoon | evening
          </div>
        </div>
      </div>

      <ApiBlock
        method="GET"
        color="bg-emerald-500"
        title="1) ดูช่วงเวลาที่ว่างอยู่"
        desc="ถ้าไม่ใส่ subject / day / slot จะคืนช่วงเวลาว่างทุกวันทุกวิชา"
        url={`${endpoint}?subject=math&day=mon&slot=morning`}
        request={`curl "${endpoint}?subject=math&day=mon"`}
        response={`{
  "count": 2,
  "slots": [
    {
      "subject": "math", "day": "mon", "day_th": "จันทร์",
      "slot": "morning", "time": "08:30-11:30",
      "capacity": 20, "booked": 3, "available": 17
    }
  ]
}`}
      />

      <ApiBlock
        method="POST"
        color="bg-sky-500"
        title="2) จองช่วงเวลาที่ว่าง"
        desc="ถ้าเต็มจะคืน 'ช่วงเวลานี้เต็ม'"
        url={endpoint}
        request={`curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "subject": "math",
    "day": "mon",
    "slot": "morning",
    "nickname": "ต๊ะ",
    "class_name": "3/8"
  }'`}
        response={`// สำเร็จ (201)
{ "success": true, "message": "ลงทะเบียนสำเร็จ", "booking": { ... } }

// เต็ม (409)
{ "success": false, "message": "ช่วงเวลานี้เต็ม" }`}
      />

      <ApiBlock
        method="DELETE"
        color="bg-rose-500"
        title="3) ยกเลิกการจอง"
        desc="ต้องส่ง nickname + class_name ให้ตรงกับตอนจอง ถึงจะยกเลิกได้"
        url={endpoint}
        request={`curl -X DELETE ${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "subject": "math",
    "day": "mon",
    "slot": "morning",
    "nickname": "ต๊ะ",
    "class_name": "3/8"
  }'`}
        response={`// สำเร็จ (200)
{ "success": true, "message": "ยกเลิกการจองสำเร็จ", "cancelled": 1 }

// ไม่ตรง (404)
{ "success": false, "message": "ไม่พบการจองที่ตรงกับชื่อเล่นและชั้นเรียนนี้ ยกเลิกไม่ได้" }`}
      />

      <ApiTester />
    </div>
  );
}

function ApiTester() {
  const [method, setMethod] = useState<"GET" | "POST" | "DELETE">("GET");
  const [subject, setSubject] = useState<"" | "math" | "science">("");
  const [day, setDay] = useState<"" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">("");
  const [slot, setSlot] = useState<"" | "morning" | "afternoon" | "evening">("");
  const [nickname, setNickname] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const test = async () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = new URL(`${base}/api/public/bookings`);

    if (subject) url.searchParams.set("subject", subject);
    if (day) url.searchParams.set("day", day);
    if (slot) url.searchParams.set("slot", slot);

    setLoading(true);
    setResponse(null);
    setStatus(null);

    try {
      let res: Response;
      if (method === "GET") {
        res = await fetch(url.toString());
      } else {
        const body: Record<string, string> = {};
        if (subject) body.subject = subject;
        if (day) body.day = day;
        if (slot) body.slot = slot;
        if (nickname) body.nickname = nickname;
        if (className) body.class_name = className;
        res = await fetch(url.toString(), {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const text = await res.text();
      setStatus(res.status);
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-lg font-bold mb-4">🧪 ทดสอบ API</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Method</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "GET" | "POST" | "DELETE")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="GET">GET - ดูช่วงเวลาว่าง</option>
            <option value="POST">POST - จอง</option>
            <option value="DELETE">DELETE - ยกเลิก</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">วิชา</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as "" | "math" | "science")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">ทั้งหมด</option>
            <option value="math">คณิตศาสตร์</option>
            <option value="science">วิทยาศาสตร์</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">วัน</span>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value as "" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">ทุกวัน</option>
            {DAY_KEYS.map((d, i) => (
              <option key={d} value={d}>{DAYS[i]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">ช่วงเวลา</span>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as "" | "morning" | "afternoon" | "evening")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">ทุกช่วง</option>
            {SLOTS.map((s) => (
              <option key={s.id} value={s.id}>{s.name} {s.time}</option>
            ))}
          </select>
        </label>
        {method !== "GET" && (
          <>
            <label className="block">
              <span className="text-sm font-medium">ชื่อเล่น</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น ต๊ะ"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">ชั้นเรียน</span>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="เช่น 3/8"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </>
        )}
      </div>
      <button
        onClick={test}
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "กำลังทดสอบ..." : "🚀 ทดสอบ API"}
      </button>
      {status !== null && (
        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground">
            Status: <span className={status >= 200 && status < 300 ? "text-emerald-600" : status >= 400 ? "text-rose-600" : "text-foreground"}>{status}</span>
          </div>
        </div>
      )}
      {response !== null && (
        <div className="mt-2">
          <div className="text-xs font-medium text-muted-foreground">Response</div>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            <code>{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function ApiBlock({
  method,
  color,
  title,
  desc,
  url,
  request,
  response,
}: {
  method: string;
  color: string;
  title: string;
  desc: string;
  url: string;
  request: string;
  response: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-bold text-white ${color}`}>
          {method}
        </span>
        <code className="break-all rounded bg-muted px-2 py-1 text-xs">{url}</code>
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <div className="mt-3">
        <div className="text-xs font-medium text-muted-foreground">Request</div>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
          <code>{request}</code>
        </pre>
      </div>
      <div className="mt-3">
        <div className="text-xs font-medium text-muted-foreground">Response</div>
        <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
          <code>{response}</code>
        </pre>
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
            <div className="text-xl font-bold text-rose-600">{bookings.length}</div>
          </div>
        </div>

        <div className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
          {bookings.length === 0 && (
            <div className="px-2 py-3 text-center text-muted-foreground">
              ยังไม่มีผู้จอง
            </div>
          )}
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                b.owner_token === myToken ? "bg-sky-50 dark:bg-sky-950/30" : ""
              }`}
            >
              <span>
                {b.nickname}{" "}
                <span className="text-muted-foreground">{b.class_name}</span>
                {b.owner_token === myToken && (
                  <span className="ml-1 text-xs text-sky-600">(คุณ)</span>
                )}
              </span>
              {b.owner_token === myToken && (
                <button
                  onClick={() => onCancel(b.id)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          ))}
        </div>

        {mine ? (
          <button
            onClick={() => onCancel(mine.id)}
            className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-600"
          >
            ยกเลิกการจองของฉัน
          </button>
        ) : (
          <button
            onClick={onBook}
            disabled={free === 0}
            className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">จอง {subject}</h3>
            <p className="text-sm text-muted-foreground">
              วัน{day} • {slot.name} {slot.time}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium">ชื่อเล่น</span>
            <input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              required
              placeholder="เช่น ต๊ะ"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {submitting ? "กำลังจอง..." : "ยืนยันการจอง"}
        </button>
      </form>
    </div>
  );
}
