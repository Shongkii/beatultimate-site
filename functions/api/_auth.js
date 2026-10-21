// 管理后台 token 验证模块
// 从请求头 Authorization 或 Cookie 中提取 token，验证是否有效
export async function verifyAdmin(request, env) {
  // 从 Authorization header 获取 token
  const authHeader = request.headers.get('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // 从 Cookie 获取
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return { valid: false };

  try {
    const record = await env.BEAT_KV.get(`admin:token:${token}`);
    if (!record) return { valid: false };

    const data = JSON.parse(record);
    if (Date.now() > data.expiresAt) return { valid: false };

    return { valid: true, token };
  } catch (err) {
    return { valid: false };
  }
}
