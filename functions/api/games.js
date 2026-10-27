export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, region, update_at, version, notes, source_url, source_type,
              source_status, source_message, patch_url, checked_at, updated_at
       FROM games ORDER BY
       CASE WHEN update_at IS NULL OR update_at = '' THEN 1 ELSE 0 END,
       update_at ASC, name COLLATE NOCASE ASC`
    ).all();
    return Response.json({ games: results || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: "อ่านฐานข้อมูลไม่ได้ ตรวจสอบ D1 binding ชื่อ DB และรัน schema.sql", detail: e.message }, { status: 500 });
  }
}