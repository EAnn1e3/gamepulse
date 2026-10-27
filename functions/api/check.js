function json(data,status=200){return Response.json(data,{status});}
function clean(s=""){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim();}
function pick(xml, tag){const re=new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,"i");const m=xml.match(re);return m?clean(m[1]):"";}
export async function onRequestPost({request,env}) {
  if(!env.ADMIN_TOKEN)return json({error:"ยังไม่ได้ตั้งค่า Secret ADMIN_TOKEN"},503);
  if(request.headers.get("x-admin-token")!==env.ADMIN_TOKEN)return json({error:"Admin Token ไม่ถูกต้อง"},401);
  let body;try{body=await request.json()}catch{return json({error:"JSON ไม่ถูกต้อง"},400)}
  if(!body.id)return json({error:"ต้องระบุ id ของเกม"},400);
  const game=await env.DB.prepare("SELECT * FROM games WHERE id=?").bind(String(body.id)).first();
  if(!game)return json({error:"ไม่พบเกมนี้ กรุณาบันทึกเกมก่อน"},404);
  if(game.source_type!=="rss")return json({error:"เกมนี้ตั้งชนิดแหล่งข้อมูลเป็น manual จึงไม่ดึง RSS ให้เปลี่ยนเป็น rss ก่อน"},400);
  if(!game.source_url)return json({error:"ยังไม่ได้ใส่ URL ของ RSS/Atom"},400);
  let u;try{u=new URL(game.source_url)}catch{return json({error:"URL แหล่งข้อมูลไม่ถูกต้อง"},400)}
  if(!["https:","http:"].includes(u.protocol))return json({error:"รองรับเฉพาะ URL http/https"},400);
  try{
    const res=await fetch(u.toString(),{headers:{"User-Agent":"GamePulse-UpdateChecker/1.0","Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8"},signal:AbortSignal.timeout(12000),redirect:"follow"});
    if(!res.ok)throw new Error("ต้นทางตอบ HTTP "+res.status);
    const xml=(await res.text()).slice(0,1_000_000);
    if(!/<(rss|feed|rdf:RDF)\b/i.test(xml))throw new Error("URL นี้ไม่ใช่ RSS/Atom ที่ตรวจจับได้ (หน้าเว็บทั่วไปต้องใช้ตัวเชื่อมเฉพาะ)");
    const item=xml.match(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/i);
    if(!item)throw new Error("ไม่พบรายการประกาศใน RSS/Atom");
    const entry=item[2],title=pick(entry,"title");
    let date=pick(entry,"pubDate")||pick(entry,"published")||pick(entry,"updated")||pick(entry,"dc:date");
    const parsed=date?new Date(date):null;
    const linkMatch=entry.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    const link=linkMatch?linkMatch[1]:pick(entry,"link");
    const validDate=parsed&&!isNaN(parsed.getTime())?parsed.toISOString():null;
    const now=new Date().toISOString();
    await env.DB.prepare(`UPDATE games SET source_status='verified',source_message=?,checked_at=?,updated_at=?,
      version=CASE WHEN version IS NULL OR version='' THEN ? ELSE version END,
      patch_url=CASE WHEN patch_url IS NULL OR patch_url='' THEN ? ELSE patch_url END
      WHERE id=?`).bind("อ่าน RSS สำเร็จ: "+(title||"พบรายการล่าสุด")+(validDate?" · วันที่ "+validDate:" · ไม่พบวันที่ในรายการ"),now,now,title||null,link||null,game.id).run();
    return json({ok:true,message:"ตรวจ RSS สำเร็จ: "+(title||"พบรายการล่าสุด")+(validDate?" ("+validDate+")":"")+
      (validDate?" ข้อควรทราบ: ระบบบันทึกสถานะการตรวจ แต่ไม่เปลี่ยนเวลาอัปเดตเกมโดยอัตโนมัติ เพราะวันที่ประกาศไม่จำเป็นต้องเป็นเวลาแพตช์เข้า":"")});
  }catch(e){
    await env.DB.prepare("UPDATE games SET source_status='error',source_message=?,checked_at=? WHERE id=?").bind(String(e.message||e).slice(0,500),new Date().toISOString(),game.id).run();
    return json({error:"ตรวจแหล่งข้อมูลไม่สำเร็จ",detail:String(e.message||e)},502);
  }
}