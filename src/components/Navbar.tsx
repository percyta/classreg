import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-lg font-bold text-primary-foreground shadow-[var(--shadow-glow)]" style={{ background: "var(--gradient-hero)" }}>
            C
          </span>
          <span className="text-lg font-bold tracking-tight">ClassReg</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">ฟีเจอร์</a>
          <a href="/#how" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">วิธีใช้งาน</a>
          <a href="/#faq" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">คำถาม</a>
          <Link
            to="/booking"
            activeProps={{ className: "text-foreground" }}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            จองคาบเรียน
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/booking"
            className="hidden rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 md:inline-flex"
            style={{ background: "var(--gradient-hero)" }}
          >
            เริ่มจองเลย
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
            aria-label="Menu"
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <a href="/#features" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">ฟีเจอร์</a>
            <a href="/#how" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">วิธีใช้งาน</a>
            <a href="/#faq" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">คำถาม</a>
            <Link to="/booking" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-primary">
              จองคาบเรียน →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
