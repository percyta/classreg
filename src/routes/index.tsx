import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClassReg — ระบบจองคาบเรียนแบบเรียลไทม์" },
      { name: "description", content: "จองคาบเรียนคณิตศาสตร์และวิทยาศาสตร์ออนไลน์ ดูที่นั่งว่างแบบ real-time ไม่ต้องสมัครสมาชิก" },
      { property: "og:title", content: "ClassReg — ระบบจองคาบเรียนแบบเรียลไทม์" },
      { property: "og:description", content: "จองคาบเรียนออนไลน์ง่าย ๆ ดูที่นั่งว่าง real-time" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-[0.08]"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-hero)" }} />

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              ระบบ Live — อัปเดตที่นั่ง real-time
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              จองคาบเรียน{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                ง่ายขึ้นกว่าเดิม
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              ระบบลงทะเบียนเรียนออนไลน์ ดูที่นั่งว่างทันที จองได้ใน 3 วินาที
              ไม่ต้องสมัครสมาชิก ไม่ต้องโหลดแอป ใช้ได้ทุกอุปกรณ์
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
                style={{ background: "var(--gradient-hero)" }}
              >
                จองคาบเรียนเลย
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                ดูฟีเจอร์
              </a>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-4 text-center">
              <Stat number="2" label="วิชา" />
              <Stat number="21" label="คาบต่อสัปดาห์" />
              <Stat number="420" label="ที่นั่งทั้งหมด" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">ฟีเจอร์</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              ทุกอย่างที่ต้องการ ในที่เดียว
            </h2>
            <p className="mt-4 text-muted-foreground">
              ออกแบบมาเพื่อความเร็วและความง่าย เน้นใช้งานจริงในห้องเรียน
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="⚡"
              title="Real-time Sync"
              desc="เห็นที่นั่งว่างพร้อมกันทุกเครื่อง อัปเดตทันทีเมื่อมีคนจอง"
            />
            <Feature
              icon="🎯"
              title="ไม่ต้องสมัครสมาชิก"
              desc="แค่กรอกชื่อเล่นและชั้นเรียน จองได้เลย ไม่ต้องตั้งรหัสผ่าน"
            />
            <Feature
              icon="📱"
              title="ใช้ได้ทุกอุปกรณ์"
              desc="มือถือ แท็บเล็ต คอมพิวเตอร์ เปิดเว็บแล้วใช้ได้ทันที"
            />
            <Feature
              icon="🔒"
              title="ยกเลิกได้เอง"
              desc="จองแล้วเปลี่ยนใจ ยกเลิกการจองของตัวเองได้ตลอดเวลา"
            />
            <Feature
              icon="📊"
              title="ดูสถิติทันที"
              desc="เห็นจำนวนที่ว่าง / ที่เต็ม / ที่คุณจองไว้ ครบในหน้าเดียว"
            />
            <Feature
              icon="🔌"
              title="มี Public API"
              desc="เชื่อมต่อกับระบบอื่นได้ผ่าน REST API สำหรับเช็คและจองอัตโนมัติ"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">วิธีใช้งาน</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              จองได้ใน 3 ขั้นตอน
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Step n="1" title="เลือกวิชา" desc="คณิตศาสตร์ หรือ วิทยาศาสตร์" />
            <Step n="2" title="เลือกช่วงเวลาที่ว่าง" desc="กดที่ช่องสีเขียวบนตาราง 7 วัน" />
            <Step n="3" title="กรอกชื่อ ยืนยัน" desc="ใส่ชื่อเล่นและชั้นเรียน เสร็จเลย" />
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              style={{ background: "var(--gradient-hero)" }}
            >
              เริ่มจองคาบเรียน
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">คำถามที่พบบ่อย</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">ข้อสงสัย</h2>
          </div>
          <div className="mt-10 space-y-3">
            <Faq q="ต้องสมัครสมาชิกไหม?" a="ไม่ต้อง ใช้ชื่อเล่นและชั้นเรียนจองได้เลย ระบบจะจดจำการจองของคุณบนอุปกรณ์นั้น" />
            <Faq q="หนึ่งคาบมีกี่ที่นั่ง?" a="คาบละ 20 ที่นั่ง รวมทั้งหมด 420 ที่นั่งต่อสัปดาห์" />
            <Faq q="ยกเลิกการจองได้ไหม?" a="ได้ กดที่ช่องสีฟ้า (ที่คุณจองไว้) เพื่อยกเลิกได้ตลอดเวลา" />
            <Faq q="ข้อมูลซิงค์เรียลไทม์จริงไหม?" a="จริง เมื่อมีคนจอง ทุกคนที่เปิดหน้าเว็บอยู่จะเห็นการเปลี่ยนแปลงทันที" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-xs font-bold text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                C
              </span>
              <span className="font-semibold text-foreground">ClassReg</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <Link to="/booking" className="font-medium hover:text-foreground">
              จองคาบเรียน →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <div
        className="bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        {number}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
      <div
        className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
        style={{ background: "var(--gradient-soft)" }}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      <div
        className="grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ background: "var(--gradient-hero)" }}
      >
        {n}
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border bg-card p-5 transition hover:border-primary/40">
      <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium">
        {q}
        <span className="text-primary transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}
