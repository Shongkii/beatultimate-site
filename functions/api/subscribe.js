// POST /api/subscribe — 邮件订阅
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = (body.email || '').trim().substring(0, 200);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: '请输入有效的邮箱地址' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查是否已订阅
    const existing = await env.BEAT_KV.get(`subscribe:${email}`);
    if (existing) {
      return new Response(JSON.stringify({ success: true, message: '该邮箱已订阅' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 存储订阅
    const record = {
      email,
      subscribedAt: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || ''
    };
    await env.BEAT_KV.put(`subscribe:${email}`, JSON.stringify(record));

    // 追加到订阅列表
    const listKey = 'subscribe:list';
    const list = await env.BEAT_KV.get(listKey);
    const arr = list ? JSON.parse(list) : [];
    if (!arr.includes(email)) {
      arr.unshift(email);
      await env.BEAT_KV.put(listKey, JSON.stringify(arr.slice(0, 5000)));
    }

    return new Response(JSON.stringify({ success: true, message: '订阅成功' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '订阅失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
