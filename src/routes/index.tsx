import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClassReg — จองคาบเรียนแบบเรียลไทม์ สำหรับทุกวัย" },
      {
        name: "description",
        content:
          "ClassReg ระบบจองคาบเรียนคณิตศาสตร์และวิทยาศาสตร์ เห็นที่ว่างแบบเรียลไทม์ เหมาะสำหรับนักเรียน นักศึกษา และผู้ใหญ่",
      },
      { property: "og:title", content: "ClassReg — จองคาบเรียนแบบเรียลไทม์" },
      {
        property: "og:description",
        content: "เห็นที่นั่งว่างทันที จองได้ในไม่กี่คลิก สำหรับทุกวัย",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28 lg:px-8">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              ✨ ระบบใหม่ • อัปเดตเรียลไทม์
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              จองคาบเรียนง่าย ๆ<br />
              <span className="text-white/90">สำหรับทุกวัย ทุกคน</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-white/90 sm:text-lg">
              ClassReg ช่วยให้คุณเห็นที่นั่งว่างของทุกคาบเรียนแบบเรียลไทม์
              จองได้ในไม่กี่คลิก ทั้งคณิตศาสตร์และวิทยาศาสตร์
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition hover:scale-105 hover:shadow-xl"
              >
                เริ่มจองเลย →
              </Link>
              <a
                href="#features"
                className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                ดูฟีเจอร์
              </a>
            </div>
            <div className="mt-8 flex gap-6 text-white/90">
              <div>
                <div className="text-2xl font-bold">2</div>
                <div className="text-xs">วิชา</div>
              </div>
              <div>
                <div className="text-2xl font-bold">21</div>
                <div className="text-xs">คาบ/สัปดาห์</div>
              </div>
              <div>
                <div className="text-2xl font-bold">⚡</div>
                <div className="text-xs">Real-time</div>
              </div>
            </div>
          </div>

          {/* Hero illustration card */}
          <div className="relative">
            <div className="rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground">
                  ตารางคาบเรียน
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  🟢 Live
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { l: "จ", s: "free" },
                  { l: "อ", s: "mine" },
                  { l: "พ", s: "free" },
                  { l: "พฤ", s: "full" },
                  { l: "ศ", s: "free" },
                  { l: "ส", s: "free" },
                  { l: "อา", s: "mine" },
                  { l: "จ", s: "full" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-semibold text-white ${
                      c.s === "free"
                        ? "bg-emerald-500"
                        : c.s === "mine"
                          ? "bg-sky-500"
                          : "bg-rose-400"
                    }`}
                  >
                    <div className="text-sm">{c.l}</div>
                    <div className="mt-0.5 text-[10px] opacity-90">
                      {c.s === "free" ? "ว่าง" : c.s === "mine" ? "ของฉัน" : "เต็ม"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                📐 คณิตศาสตร์ • บ่าย • เหลือ 14/20 ที่นั่ง
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ทำไมต้อง ClassReg?
          </h2>
          <p className="mt-3 text-muted-foreground">
            ออกแบบมาเพื่อให้ทุกคนใช้งานได้ ตั้งแต่น้องประถมจนถึงผู้ปกครอง
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "⚡",
              title: "อัปเดตเรียลไทม์",
              desc: "เห็นที่นั่งว่างทันที ไม่ต้องรีเฟรช ทุกคนเห็นข้อมูลเดียวกัน",
              color: "bg-sky-100 text-sky-700",
            },
            {
              icon: "🎨",
              title: "ใช้ง่ายสุด ๆ",
              desc: "สีสันชัดเจน เขียว=ว่าง แดง=เต็ม ฟ้า=ที่ฉันจอง เด็กก็เข้าใจ",
              color: "bg-orange-100 text-orange-700",
            },
            {
              icon: "📱",
              title: "ใช้ได้ทุกอุปกรณ์",
              desc: "เปิดได้ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์",
              color: "bg-purple-100 text-purple-700",
            },
            {
              icon: "🔒",
              title: "ยกเลิกง่าย",
              desc: "จองพลาดก็ยกเลิกได้ทันที ไม่ต้องรอใคร",
              color: "bg-emerald-100 text-emerald-700",
            },
            {
              icon: "📊",
              title: "เห็นภาพรวม",
              desc: "ดูจำนวนที่ว่าง ที่เต็ม และที่จองแล้วได้ในที่เดียว",
              color: "bg-yellow-100 text-yellow-700",
            },
            {
              icon: "🚀",
              title: "ไม่ต้องสมัครสมาชิก",
              desc: "เปิดเว็บแล้วจองได้เลย ใช้แค่ชื่อเล่นกับชั้นเรียน",
              color: "bg-pink-100 text-pink-700",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${f.color}`}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AUDIENCE */}
      <section
        className="py-20"
        style={{ background: "var(--gradient-soft)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              เหมาะกับทุกวัย
            </h2>
            <p className="mt-3 text-muted-foreground">
              ไม่ว่าจะเรียนอยู่ระดับไหน ก็ใช้งานได้ง่าย
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: "🧒",
                title: "วัยเด็ก",
                desc: "ปุ่มใหญ่ สีชัด มี emoji ช่วยให้น้อง ๆ จองคาบเรียนเองได้",
              },
              {
                emoji: "🧑‍🎓",
                title: "วัยรุ่น",
                desc: "ใช้บนมือถือได้ลื่น เห็นคาบว่างของเพื่อนแบบเรียลไทม์",
              },
              {
                emoji: "👨‍👩‍👧",
                title: "ผู้ใหญ่",
                desc: "ข้อมูลครบ จัดการตารางเรียนของลูกได้ในไม่กี่นาที",
              },
            ].map((a) => (
              <div
                key={a.title}
                className="rounded-2xl bg-card p-8 text-center shadow-sm"
              >
                <div className="text-6xl">{a.emoji}</div>
                <h3 className="mt-4 text-xl font-bold">{a.title}</h3>
                <p className="mt-2 text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div
          className="rounded-3xl p-10 text-white shadow-xl sm:p-14"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h2 className="text-3xl font-bold sm:text-4xl">
            พร้อมจองคาบเรียนแล้วหรือยัง?
          </h2>
          <p className="mt-3 text-white/90">
            กดปุ่มด้านล่างเพื่อเริ่มจองได้เลย ไม่ต้องสมัครสมาชิก
          </p>
          <Link
            to="/booking"
            className="mt-6 inline-block rounded-full bg-white px-8 py-4 font-semibold text-primary shadow-lg transition hover:scale-105"
          >
            ไปหน้าจองคาบเรียน →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} ClassReg • สร้างด้วย ❤️ เพื่อทุกคน
        </div>
      </footer>
    </div>
  );
}
