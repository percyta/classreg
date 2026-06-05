## เอา API Docs section ออกจากหน้าบ้าน

### เป้าหมาย
ลบ tab "API Docs" และส่วนทดสอบ API ออกจากหน้าบ้าน (`src/routes/index.tsx`) ให้เหลือแค่หน้าจองคาบเรียนอย่างเดียว

### รายละเอียด
- ลบ `view` state และ tab switcher (ปุ่มสลับระหว่าง "จองคาบเรียน" กับ "API Docs")
- ลบ conditional rendering `{view === "api" ? <ApiDocs /> : ...}` ให้แสดง booking grid โดยตรง
- ลบ component `ApiDocs` ทั้งหมด
- ลบ component `ApiTester` ทั้งหมด
- ลบ component `ApiBlock` ทั้งหมด
- ไม่แตะไฟล์ API หลังบ้าน (`src/routes/api/public/bookings.ts`) — API ยังใช้งานได้ตามปกติ
- ไม่แตะ database schema หรือ migrations

### ไฟล์ที่แก้ไข
- `src/routes/index.tsx` — ลบ code ที่เกี่ยวข้องกับ API docs / tester / tabs ออก