// POST /api/admin-login — 管理后台登录
// 验证密码后返回 token（存储在 KV，24小时过期）
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const password = body.password || '';

    if (!password) {
      return new Response(JSON.stringify({ error: '请输入密码' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证密码（密码存储在 Cloudflare 环境变量 ADMIN_PASSWORD）
    const adminPassword = env.ADMIN_PASSWORD || 'beatultimate';
    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: '密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 生成 token
    const token = Date.now().toString(36) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时

    await env.BEAT_KV.put(`admin:token:${token}`, JSON.stringify({ expiresAt }), {
      expirationTtl: 24 * 60 * 60
    });

    return new Response(JSON.stringify({ success: true, token, expiresAt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '登录失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
