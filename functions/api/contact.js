// POST /api/contact — 联系表单提交
// 数据存储到 Cloudflare KV，可在管理后台查看
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const name = (body.name || '').trim().substring(0, 100);
    const email = (body.email || '').trim().substring(0, 200);
    const message = (body.message || '').trim().substring(0, 5000);

    // 基础校验
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: '姓名、邮箱、留言均为必填' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: '邮箱格式不正确' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 存储到 KV
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const record = {
      id,
      type: 'contact',
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || ''
    };

    await env.BEAT_KV.put(`contact:${id}`, JSON.stringify(record));

    // 同时追加到列表索引
    const listKey = 'contact:list';
    const existing = await env.BEAT_KV.get(listKey);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift({ id, name, email, createdAt: record.createdAt });
    await env.BEAT_KV.put(listKey, JSON.stringify(list.slice(0, 500)));

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '提交失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
