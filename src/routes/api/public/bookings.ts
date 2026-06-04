import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_NAMES_TH = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const SLOTS = ["morning", "afternoon", "evening"] as const;
const SUBJECTS = ["math", "science"] as const;
const CAPACITY = 20;

type Day = (typeof DAY_KEYS)[number];
type Slot = (typeof SLOTS)[number];
type Subject = (typeof SUBJECTS)[number];

const SLOT_TIME: Record<Slot, string> = {
  morning: "08:30-11:30",
  afternoon: "13:00-15:00",
  evening: "17:00-18:30",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: cors });

function dayIndex(d: Day) {
  return DAY_KEYS.indexOf(d);
}

const BookSchema = z.object({
  subject: z.enum(SUBJECTS),
  day: z.enum(DAY_KEYS),
  slot: z.enum(SLOTS),
  nickname: z.string().trim().min(1).max(40),
  class_name: z.string().trim().min(1).max(40),
});

const CancelSchema = BookSchema;

export const Route = createFileRoute("/api/public/bookings")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      // 1) View available slots
      GET: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const qSubject = url.searchParams.get("subject");
        const qDay = url.searchParams.get("day");
        const qSlot = url.searchParams.get("slot");

        if (qSubject && !SUBJECTS.includes(qSubject as Subject))
          return json(400, { error: "subject ต้องเป็น math หรือ science" });
        if (qDay && !DAY_KEYS.includes(qDay as Day))
          return json(400, { error: `day ต้องเป็น ${DAY_KEYS.join("|")}` });
        if (qSlot && !SLOTS.includes(qSlot as Slot))
          return json(400, { error: `slot ต้องเป็น ${SLOTS.join("|")}` });

        const { data, error } = await supabaseAdmin.from("bookings").select("subject,day_index,slot");
        if (error) return json(500, { error: error.message });

        const counts = new Map<string, number>();
        for (const b of data ?? []) {
          const k = `${b.subject}-${b.day_index}-${b.slot}`;
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }

        const subjects = qSubject ? [qSubject as Subject] : [...SUBJECTS];
        const days = qDay ? [qDay as Day] : [...DAY_KEYS];
        const slots = qSlot ? [qSlot as Slot] : [...SLOTS];

        const result: Array<{
          subject: Subject;
          day: Day;
          day_th: string;
          slot: Slot;
          time: string;
          capacity: number;
          booked: number;
          available: number;
        }> = [];

        for (const s of subjects) {
          for (const d of days) {
            for (const sl of slots) {
              const booked = counts.get(`${s}-${dayIndex(d)}-${sl}`) ?? 0;
              const available = CAPACITY - booked;
              if (available > 0) {
                result.push({
                  subject: s,
                  day: d,
                  day_th: DAY_NAMES_TH[dayIndex(d)],
                  slot: sl,
                  time: SLOT_TIME[sl],
                  capacity: CAPACITY,
                  booked,
                  available,
                });
              }
            }
          }
        }

        return json(200, { count: result.length, slots: result });
      },

      // 2) Book a slot
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: "invalid JSON body" });
        }
        const parsed = BookSchema.safeParse(body);
        if (!parsed.success)
          return json(400, { error: "พารามิเตอร์ไม่ถูกต้อง", details: parsed.error.flatten() });

        const { subject, day, slot, nickname, class_name } = parsed.data;
        const d_index = dayIndex(day);

        const { count, error: countErr } = await supabaseAdmin
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("subject", subject)
          .eq("day_index", d_index)
          .eq("slot", slot);
        if (countErr) return json(500, { error: countErr.message });
        if ((count ?? 0) >= CAPACITY)
          return json(409, { success: false, message: "ช่วงเวลานี้เต็ม" });

        const owner_token = `api:${nickname}|${class_name}`;
        const { data, error } = await supabaseAdmin
          .from("bookings")
          .insert({ subject, day_index: d_index, slot, nickname, class_name, owner_token })
          .select()
          .single();
        if (error) return json(500, { success: false, message: error.message });

        return json(201, {
          success: true,
          message: "ลงทะเบียนสำเร็จ",
          booking: {
            id: data.id,
            subject,
            day,
            day_th: DAY_NAMES_TH[d_index],
            slot,
            time: SLOT_TIME[slot],
            nickname,
            class_name,
          },
        });
      },

      // 3) Cancel a slot
      DELETE: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: "invalid JSON body" });
        }
        const parsed = CancelSchema.safeParse(body);
        if (!parsed.success)
          return json(400, { error: "พารามิเตอร์ไม่ถูกต้อง", details: parsed.error.flatten() });

        const { subject, day, slot, nickname, class_name } = parsed.data;
        const d_index = dayIndex(day);

        const { data: matches, error } = await supabaseAdmin
          .from("bookings")
          .select("id,nickname,class_name")
          .eq("subject", subject)
          .eq("day_index", d_index)
          .eq("slot", slot)
          .eq("nickname", nickname)
          .eq("class_name", class_name);
        if (error) return json(500, { success: false, message: error.message });
        if (!matches || matches.length === 0)
          return json(404, {
            success: false,
            message: "ไม่พบการจองที่ตรงกับชื่อเล่นและชั้นเรียนนี้ ยกเลิกไม่ได้",
          });

        const ids = matches.map((m) => m.id);
        const { error: delErr } = await supabaseAdmin.from("bookings").delete().in("id", ids);
        if (delErr) return json(500, { success: false, message: delErr.message });

        return json(200, {
          success: true,
          message: "ยกเลิกการจองสำเร็จ",
          cancelled: matches.length,
        });
      },
    },
  },
});
