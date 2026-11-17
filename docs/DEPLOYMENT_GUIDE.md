# คู่มือการเปิดใช้งานเว็บไซต์ออนไลน์จริง (Vercel & GitHub Deployment Guide)
## สำหรับเจ้าของร้าน ShadowMarket (ฉบับเข้าใจง่าย ไม่ต้องมีความรู้เรื่องโค้ด)

ยินดีด้วยครับ! ระบบร้านค้า **ShadowMarket** ได้รับการพัฒนา ทดสอบความปลอดภัย และพร้อมเปิดให้บริการแก่ลูกค้าจริงแล้ว เอกสารฉบับนี้จะแนะนำวิธีนำเว็บไซต์ขึ้นสู่ระบบคลาวด์ระดับโลกของ **Vercel** โดยใช้เวลาเพียง 5-10 นาทีครับ

---

### ขั้นตอนที่ 1: นำโค้ดขึ้น GitHub (แหล่งเก็บโค้ดของร้าน)

1. เข้าไปที่ [GitHub.com](https://github.com) และเข้าสู่ระบบ (หรือกด Sign up เพื่อสมัครบัญชีฟรี)
2. กดปุ่มสีเขียว **"New"** (หรือสร้าง Repository ใหม่)
   - ตั้งชื่อว่า: `shadowmarket`
   - เลือกเป็น: **Private** (เพื่อความปลอดภัยเฉพาะร้านคุณเท่านั้น)
   - ไม่ต้องติ๊ก Add README หรือ Add .gitignore
   - กดปุ่ม **"Create repository"**
3. คัดลอกลิงก์ Repository ที่ได้ เช่น `https://github.com/your-username/shadowmarket.git`
4. รันคำสั่งนี้บนเครื่องคอมพิวเตอร์ของคุณเพียงครั้งเดียว:
   ```bash
   git remote add origin https://github.com/your-username/shadowmarket.git
   git branch -M main
   git push -u origin main
   ```
   *(หรือสามารถลากโฟลเดอร์ผ่านโปรแกรม GitHub Desktop ได้อย่างง่ายดาย)*

---

### ขั้นตอนที่ 2: นำขึ้นระบบออนไลน์ด้วย Vercel (โฮสติ้งฟรีระดับโลก)

1. เข้าไปที่ [Vercel.com](https://vercel.com) และกด **Sign Up** โดยเลือก **"Continue with GitHub"**
2. เมื่อเข้าสู่หน้าแดชบอร์ด กดปุ่ม **"Add New..."** &gt; **"Project"**
3. ในส่วน **"Import Git Repository"** คุณจะเห็นชื่อโปรเจกต์ `shadowmarket` ให้กดปุ่ม **"Import"**
4. ในหน้าการตั้งค่าก่อน Deploy ให้ดูที่ส่วน **"Environment Variables"** (ค่าความปลอดภัยของระบบ)
5. คัดลอกค่าทั้ง 6 รายการด้านล่างนี้ไปวางลงในช่อง:

| ชื่อตัวแปร (Key) | ค่าความปลอดภัย (Value) | คำอธิบาย |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | ดูได้จากไฟล์ `.env.local` หรือแชทสรุป | ที่อยู่ฐานข้อมูล Supabase สิงคโปร์ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ดูได้จากไฟล์ `.env.local` หรือแชทสรุป | กุญแจสาธารณะสำหรับเชื่อมต่อข้อมูล |
| `SUPABASE_SERVICE_ROLE_KEY` | ดูได้จากไฟล์ `.env.local` หรือแชทสรุป | กุญแจลับระดับผู้ดูแลระบบหลังบ้าน |
| `LICENSE_ENCRYPTION_KEY` | ดูได้จากไฟล์ `.env.local` หรือแชทสรุป | กุญแจเข้ารหัสคีย์ระดับกองทัพ AES-256 |
| `PAYMENT_WEBHOOK_SECRET` | ดูได้จากไฟล์ `.env.local` หรือแชทสรุป | กุญแจตรวจสอบลายเซ็นการโอนเงิน |
| `PAYMENT_SANDBOX_MODE` | `true` | โหมดทดสอบปลอดภัย 100% |

6. กดปุ่มสีน้ำเงิน **"Deploy"**
7. รอระบบทำงานประมาณ 1-2 นาที คุณจะได้ลิงก์เว็บไซต์จริงทันที เช่น `https://shadowmarket.vercel.app` 🎉

---

### ขั้นตอนที่ 3: การผูกชื่อเว็บไซต์ของร้าน (Custom Domain & SSL ฟรี)

หากเจ้าของร้านมีโดเมนของตัวเอง (เช่น `shadowmarket.com` หรือ `shadowmarket.store`):

1. ในหน้า Vercel Dashboard ของโปรเจกต์ ไปที่ **Settings** &gt; **Domains**
2. พิมพ์ชื่อโดเมนที่คุณเป็นเจ้าของ และกด **Add**
3. Vercel จะแสดงค่า DNS ที่ต้องนำไปกรอกที่เว็บจดโดเมนของคุณ (เช่น GoDaddy, Namecheap, Cloudflare, DotSiam):
   - **Type A**: Name `@` &gt; Value `76.76.21.21`
   - **Type CNAME**: Name `www` &gt; Value `cname.vercel-dns.com`
4. Vercel จะออกใบรับรองความปลอดภัยกุญแจเขียว (SSL/TLS HTTPS) ให้ฟรีอัตโนมัติ 100%

---

### ขั้นตอนที่ 4: การตรวจสอบสถานะระบบหลังเปิดใช้งาน (Health Check)

เมื่อเว็บไซต์เปิดใช้งานแล้ว คุณสามารถพิมพ์ลิงก์:
`https://yourdomain.com/api/health`
ระบบจะตอบกลับว่า:
```json
{
  "status": "healthy",
  "platform": "ShadowMarket Vault Engine",
  "version": "2.0.0",
  "region": "sin1 (Singapore Edge)",
  "database": "connected (Supabase PostgreSQL)",
  "timestamp": "2026-11-17T..."
}
```
แสดงว่าเว็บไซต์และฐานข้อมูลเชื่อมต่อกันสมบูรณ์แบบ 100%!
