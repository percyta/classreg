## เป้าหมาย
ปรับธีมสีของทั้งระบบให้เป็นแนว **Fresh Mint** (เขียวมิ้นต์ สดใส minimal คล้าย Cal.com / Linear) และรีดีไซน์หน้าจอง `/booking` ให้สวยและสม่ำเสมอกับ landing page

---

## 1. ปรับ Design Tokens (`src/styles.css`)
เปลี่ยน palette จาก indigo-violet เป็น emerald/mint:

- `--primary` → emerald 500 (`oklch(0.68 0.17 165)`) — เขียวมิ้นต์สด
- `--primary-glow` → mint อ่อน (`oklch(0.85 0.13 165)`)
- `--accent` → emerald deep (`oklch(0.35 0.08 165)`)
- `--background` → off-white อมเขียวบางๆ (`oklch(0.995 0.005 165)`)
- `--foreground` → emerald 950 เข้มมาก (`oklch(0.18 0.04 165)`)
- `--muted` → mint pale (`oklch(0.97 0.015 165)`)
- `--border` → mint border (`oklch(0.92 0.015 165)`)
- `--gradient-hero` → linear-gradient จาก emerald 500 → mint 300 → cream
- `--gradient-soft` → mint pale → white
- `--shadow-glow` → emerald tint
- ปรับ dark mode ให้สอดคล้อง (emerald ที่ความสว่างต่ำ + พื้นหลัง slate-emerald เข้ม)

---

## 2. ปรับ Landing Page (`src/routes/index.tsx`)
- คงโครงสร้างเดิม (hero / features / how / faq / footer)
- เปลี่ยนทุกที่ที่ใช้สี hardcoded จาก `text-emerald-*` / `bg-emerald-*` ที่ไม่ใช่ token ให้ใช้ token แทน
- ลดความเข้มของ gradient hero ให้เป็น mint สดใส ไม่ฉูดฉาด — minimal & clean ตามที่เลือก
- ปรับ feature card / step card ให้ใช้ border + shadow บางลง (สไตล์ Cal.com)
- ปรับขนาด text/spacing ให้โปร่งขึ้น (more whitespace)

---

## 3. รีดีไซน์หน้า `/booking` (`src/routes/booking.tsx`)
ปรับโครงสร้าง UI ให้ minimal & clean สม่ำเสมอกับ landing:

**Header section**
- Title สั้นลง ใช้ font weight bold ขนาด balanced
- Subject tabs เปลี่ยนเป็น segmented pill (เหมือน iOS / Linear) แทนปุ่มแยก
- Live indicator ปรับเป็น chip มี dot animate

**Stats cards**
- ใช้ card น้อยลง (รวม 4 ตัวเป็นแถวเดียวแบบ slim) มี icon เล็ก
- เปลี่ยนสีตัวเลขให้ใช้ emerald (mine), muted (booked), foreground (total), accent (free)

**Grid ตาราง**
- แทนที่ตารางสีเขียว/แดง/ฟ้าจัด ๆ ด้วย:
  - ว่าง: card สีขาวมี border emerald บาง ๆ + แสดง "X ที่นั่ง"
  - เต็ม: card สี muted + ข้อความ "เต็ม" สีจาง
  - ของฉัน: card mint อ่อน + border emerald หนา + checkmark
- เปลี่ยนเลเอาท์เป็น grid card-based แทน HTML table (responsive ดีกว่าบนมือถือ)
- เพิ่ม day header เป็น chip มน
- ปุ่ม "ดูรายละเอียด" ย้ายเป็น icon เล็กบนมุมขวาบนของ card

**Detail panel & Booking modal**
- ปรับ rounded เป็น 2xl, shadow บางลง
- ปุ่มหลักใช้ gradient mint (เหมือนปุ่มใน landing)
- เปลี่ยนสีพื้นปุ่มยกเลิกจาก rose จัด ๆ เป็น destructive token / outline

**Legend**
- ย้ายไปอยู่ใต้ subject tabs แบบ inline compact

---

## 4. ปรับ Navbar (`src/components/Navbar.tsx`)
- โลโก้ "C" ใช้ gradient mint ใหม่ (token-based)
- ปุ่ม CTA "เริ่มจองเลย" ใช้ gradient เดียวกัน
- เพิ่ม subtle border เมื่อ scroll (ปัจจุบันมีอยู่แล้ว — แค่ปรับสี)

---

## ไฟล์ที่แก้
- `src/styles.css` — เปลี่ยน palette + gradient + shadow tokens
- `src/routes/index.tsx` — ปรับสี hard-coded ให้ใช้ token + ลด visual noise
- `src/routes/booking.tsx` — รีดีไซน์หน้าจอง (grid, cards, modal, legend)
- `src/components/Navbar.tsx` — เช็คให้สี + gradient ตรงกัน

## ไม่แตะ
- Database schema และ migrations
- API endpoint (`src/routes/api/public/bookings.ts`)
- Realtime / business logic ใด ๆ
- Security memory และ RLS policies

## ผลลัพธ์ที่คาดหวัง
- ทั้ง landing และ booking ใช้ palette mint เดียวกัน ดู cohesive
- หน้าจองดูทันสมัย minimal สไตล์ Cal.com — ไม่มีสีเขียว/แดง/ฟ้า saturate เกินไป
- responsive บนมือถือดีขึ้น (grid แทน table)
