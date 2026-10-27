# GamePulse — ติดตั้งภาษาไทย

## ไฟล์ในโปรเจกต์
- `public/index.html` หน้าเว็บ GamePulse
- `functions/api/games.js` API อ่านข้อมูลจาก D1
- `functions/api/admin/games.js` API เพิ่ม/แก้ไขเกม (ป้องกันด้วย ADMIN_TOKEN)
- `functions/api/check.js` ตัวตรวจ RSS/Atom แบบสั่งตรวจ
- `migrations/0001_init.sql` โครงสร้างฐานข้อมูล
- `wrangler.toml` การตั้งค่า Cloudflare Pages และ D1

## ขั้นตอนติดตั้งแบบแนะนำ (ใช้ GitHub + Cloudflare Pages)
1. แตกไฟล์ ZIP แล้วอัปโหลดไฟล์ทั้งหมดเข้า repository ใหม่ใน GitHub เช่น `gamepulse`.
2. Cloudflare Dashboard → Storage & databases → D1 SQL Database → Create database.
3. ตั้งชื่อ `gamepulse-db` แล้วสร้างฐานข้อมูล
4. เปิดฐานข้อมูล → Console แล้วคัดลอก/รัน SQL ใน `migrations/0001_init.sql` ทั้งหมด
5. คัดลอก Database ID จากหน้า D1
6. ใน `wrangler.toml` แทน `REPLACE_WITH_YOUR_D1_DATABASE_ID` ด้วย Database ID จริง
7. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
8. เลือก repository `gamepulse`; Framework preset เลือก None; Build command เว้นว่าง; Build output directory ใส่ `public`.
9. Deploy
10. เปิดโปรเจกต์ Pages → Settings → Bindings → Add → D1 database. Variable name ต้องเป็น `DB`, เลือกฐานข้อมูล `gamepulse-db` แล้ว Save
11. Settings → Variables and Secrets → Add → Secret. ตั้งชื่อ `ADMIN_TOKEN` และใส่รหัสลับยาวแบบสุ่มที่คุณเก็บไว้เอง
12. กด Redeploy เพื่อให้ binding/secret มีผล

## ทดสอบ
- เปิด URL Pages ของคุณ ควรเห็นหน้า GamePulse และข้อความว่าพบ 0 เกม
- เปิดส่วน “ผู้ดูแลระบบ” ใส่ ADMIN_TOKEN แล้วกรอกชื่อเกม ภูมิภาค วันเวลา เวอร์ชัน และรายละเอียด จากนั้นกดบันทึก
- ถ้าต้องการตรวจ RSS ให้ใส่ URL RSS/Atom ที่เข้าถึงได้สาธารณะ เลือกชนิดแหล่งข้อมูล `rss` บันทึกก่อน แล้วกด “ตรวจสอบแหล่งข้อมูล”
- ตัวตรวจ RSS นี้ใช้ตรวจรายการประกาศล่าสุดเท่านั้น ไม่สามารถสรุปวันเวลาแพตช์จาก RSS ทุกรายการได้โดยอัตโนมัติ วันเวลาอัปเดตเกมจึงต้องใส่เองจนกว่าจะเพิ่มตัวเชื่อมเฉพาะของเกมนั้น

## หมายเหตุสำคัญ
- อย่าเผยแพร่ ADMIN_TOKEN ในโค้ดหรือ GitHub; ใส่ใน Cloudflare Secret เท่านั้น
- ตัวอย่างเริ่มต้นยังไม่มีระบบล็อกอินหลายผู้ดูแลหรือระบบตรวจ RSS อัตโนมัติเป็นรอบเวลา
- การตรวจอัตโนมัติตามตารางต้องเพิ่ม Cloudflare Worker ที่มี Cron Trigger หรือ scheduler ภายนอกให้เรียกงานตรวจตามรอบ
- หากแหล่งข้อมูลเป็นหน้าเว็บธรรมดา ไม่ใช่ RSS/Atom ต้องเขียน parser/connector เฉพาะแหล่งนั้น และตรวจเงื่อนไขการใช้งานของต้นทาง
