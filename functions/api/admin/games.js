function json(data, status=200) { return Response.json(data, { status }); }
export async function onRequestPost({ request, env }) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return json({ error: "ยังไม่ได้ตั้งค่า Secret ADMIN_TOKEN ใน Cloudflare Pages" }, 503);
  if (request.headers.get("x-admin-token") !== expected) return json({ error: "Admin Token ไม่ถูกต้อง" }, 401);
  let b;
  try { b = await request.json(); } catch { return json({ error: "JSON ไม่ถูกต้อง" }, 400); }
  if (!b.name || typeof b.name !== "string") return json({ error: "กรุณาระบุชื่อเกม" }, 400);
  const id = (b.id && String(b.id).trim()) || crypto.randomUUID();
  const region = String(b.region || "SEA").slice(0, 30);
  const sourceType = b.source_type === "rss" ? "rss" : "manual";
  const updateAt = b.update_at || null;
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO games
      (id,name,region,update_at,version,notes,source_url,source_type,source_status,source_message,patch_url,checked_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name,region=excluded.region,update_at=excluded.update_at,
      version=excluded.version,notes=excluded.notes,source_url=excluded.source_url,source_type=excluded.source_type,
      patch_url=excluded.patch_url,updated_at=excluded.updated_at`)
      .bind(id, b.name.trim().slice(0,160), region, updateAt, String(b.version||"").slice(0,80),
        String(b.notes||"").slice(0,10000), String(b.source_url||"").slice(0,1000), sourceType,
        sourceType === "manual" ? "manual" : "pending", "", String(b.patch_url||"").slice(0,1000), null, now).run();
    return json({ ok: true, id });
  } catch (e) { return json({ error: "บันทึกเกมไม่สำเร็จ", detail: e.message }, 500); }
}