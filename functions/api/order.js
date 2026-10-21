// POST /api/order — 提交订单
// 订单存储到 KV，管理后台可查看
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { items, customer, shipping } = body;

    // 校验
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: '购物车为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return new Response(JSON.stringify({ error: '请填写完整的联系信息' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!shipping || !shipping.address || !shipping.city || !shipping.province || !shipping.zip) {
      return new Response(JSON.stringify({ error: '请填写完整的收货地址' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 计算总价
    let total = 0;
    const orderItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      total += price * qty;
      return {
        id: item.id,
        name: item.name,
        size: item.size || '',
        price,
        quantity: qty,
        subtotal: price * qty
      };
    });

    // 生成订单号
    const orderNo = 'BU' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    const order = {
      orderNo,
      status: 'pending', // pending / paid / shipped / completed / cancelled
      items: orderItems,
      total,
      customer: {
        name: customer.name.substring(0, 100),
        email: customer.email.substring(0, 200),
        phone: customer.phone.substring(0, 50)
      },
      shipping: {
        name: (shipping.name || customer.name).substring(0, 100),
        phone: (shipping.phone || customer.phone).substring(0, 50),
        province: shipping.province.substring(0, 50),
        city: shipping.city.substring(0, 50),
        address: shipping.address.substring(0, 500),
        zip: shipping.zip.substring(0, 20)
      },
      note: (body.note || '').substring(0, 1000),
      createdAt: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || ''
    };

    // 存储订单
    await env.BEAT_KV.put(`order:${orderNo}`, JSON.stringify(order));

    // 追加到订单列表
    const listKey = 'order:list';
    const existing = await env.BEAT_KV.get(listKey);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift({
      orderNo,
      total,
      status: order.status,
      customerName: order.customer.name,
      createdAt: order.createdAt
    });
    await env.BEAT_KV.put(listKey, JSON.stringify(list.slice(0, 1000)));

    return new Response(JSON.stringify({ success: true, orderNo, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '下单失败，请稍后重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
