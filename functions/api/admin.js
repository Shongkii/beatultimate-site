// /api/admin — 管理后台数据接口
// GET  ?type=orders|contacts|subscribes  获取列表
// GET  ?type=order&id=ORDER_NO          获取订单详情
// POST { action:'updateOrder', orderNo, status }  更新订单状态
import { verifyAdmin } from './_auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 验证管理员身份
  const auth = await verifyAdmin(request, env);
  if (!auth.valid) {
    return new Response(JSON.stringify({ error: '未登录或登录已过期' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'GET') {
    return handleGet(url, env);
  }
  if (request.method === 'POST') {
    return handlePost(request, env);
  }

  return new Response(JSON.stringify({ error: '不支持的方法' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGet(url, env) {
  const type = url.searchParams.get('type');

  try {
    if (type === 'orders') {
      const list = await env.BEAT_KV.get('order:list');
      return json(list ? JSON.parse(list) : []);
    }

    if (type === 'contacts') {
      const list = await env.BEAT_KV.get('contact:list');
      return json(list ? JSON.parse(list) : []);
    }

    if (type === 'subscribes') {
      const list = await env.BEAT_KV.get('subscribe:list');
      return json(list ? JSON.parse(list) : []);
    }

    if (type === 'order') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: '缺少订单号' }, 400);
      const order = await env.BEAT_KV.get(`order:${id}`);
      if (!order) return json({ error: '订单不存在' }, 404);
      return json(JSON.parse(order));
    }

    if (type === 'contact') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: '缺少ID' }, 400);
      const msg = await env.BEAT_KV.get(`contact:${id}`);
      if (!msg) return json({ error: '记录不存在' }, 404);
      return json(JSON.parse(msg));
    }

    return json({ error: '未知类型' }, 400);
  } catch (err) {
    return json({ error: '读取失败' }, 500);
  }
}

async function handlePost(request, env) {
  try {
    const body = await request.json();

    if (body.action === 'updateOrder') {
      const { orderNo, status } = body;
      if (!orderNo || !status) return json({ error: '缺少参数' }, 400);

      const orderStr = await env.BEAT_KV.get(`order:${orderNo}`);
      if (!orderStr) return json({ error: '订单不存在' }, 404);

      const order = JSON.parse(orderStr);
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await env.BEAT_KV.put(`order:${orderNo}`, JSON.stringify(order));

      // 更新列表中的状态
      const listStr = await env.BEAT_KV.get('order:list');
      if (listStr) {
        const list = JSON.parse(listStr);
        const idx = list.findIndex((o) => o.orderNo === orderNo);
        if (idx >= 0) {
          list[idx].status = status;
          await env.BEAT_KV.put('order:list', JSON.stringify(list));
        }
      }

      return json({ success: true });
    }

    return json({ error: '未知操作' }, 400);
  } catch (err) {
    return json({ error: '操作失败' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
