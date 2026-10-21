# Beat Ultimate 品牌官网 — Cloudflare Pages 动态网站

## 项目结构

```
beat-ultimate/
├── index.html              # 首页（品牌介绍 + 各板块入口）
├── shop.html               # 商店（商品展示 + 淘宝/抖音外部链接）
├── culture.html            # 文化板块（音乐 + 漫画合并页）
├── suggest.html            # 共创（用户建议提交，仅后台可见）
├── admin.html              # 管理后台（建议/留言/订阅管理）
├── assets/
│   ├── js/common.js        # 共享 JS（数据加载/工具函数）
│   ├── logo-badge.jpg      # 图B ULT纯徽章
│   ├── logo-combined.jpg   # 图A 组合标
│   └── logo-wordmark.jpg   # 图C 纯文字标
├── data/
│   ├── products.json       # 商品数据（改这个就更新商品）
│   ├── music.json          # 音乐数据
│   └── comics.json         # 漫画章节数据
├── functions/api/          # Cloudflare Pages Functions（后端 API，暂未启用）
│   ├── _auth.js            # 管理员 token 验证
│   ├── contact.js          # 联系表单提交 → KV
│   ├── subscribe.js        # 邮件订阅 → KV
│   ├── order.js            # 下单 → KV（暂未使用）
│   ├── admin-login.js      # 管理后台登录
│   └── admin.js            # 管理后台数据接口
├── wrangler.toml           # Cloudflare 配置（KV绑定/环境变量）
├── package.json
└── .gitignore
```

## 页面说明

| 页面 | 说明 |
|------|------|
| `index.html` | 首页：Hero、品牌介绍、服饰预览、音乐/漫画简介、联系方式 |
| `shop.html` | 商店：商品列表展示，底部放淘宝/抖音店铺链接（无购物车） |
| `culture.html` | 文化：上方大板块介绍，下方两个小块分别是音乐（播放器）和漫画（章节） |
| `suggest.html` | 共创：用户提交建议，提交后不显示在页面上，仅品牌团队后台可见 |
| `admin.html` | 管理后台：查看建议、联系留言、订阅（需密码登录） |

## 导航结构

关于 → 商店 → 文化 → 共创 → 联系 → 登录

- **登录**：手机号 + 验证码（前端 UI 已完成，后端验证码接口待接）
- 登录状态存在 localStorage，刷新后保留

## 部署步骤（Cloudflare Pages + GitHub）

### 1. 推送代码到 GitHub

把整个项目目录推送到你的 GitHub 仓库（beatultimate.space 对应的仓库）。

### 2. 创建 KV 命名空间

在 Cloudflare Dashboard → Workers & Pages → KV → 创建命名空间：
- 名称：`beat-ultimate-kv`
- 创建后复制命名空间 ID

### 3. 连接 GitHub 仓库到 Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. 选择你的 GitHub 仓库
3. 构建设置：
   - **Framework preset**: None
   - **Build command**: 留空
   - **Build output directory**: `.`（根目录）
4. 点击 Save and Deploy

### 4. 绑定 KV 命名空间

部署完成后，进入项目 → Settings → Functions → KV namespace bindings：
- **Variable name**: `BEAT_KV`
- **KV namespace**: 选择刚才创建的 `beat-ultimate-kv`

### 5. 设置环境变量

Settings → Environment variables：
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `ADMIN_PASSWORD` | 你的管理密码 | 管理后台登录密码 |
| `CONTACT_EMAIL` | LBJ24810236@outlook.com | 联系表单接收邮箱 |

> 注意：环境变量设置后需要重新部署才生效。

### 6. 绑定自定义域名

项目 → Custom domains → Add custom domain → 输入 `beatultimate.space`
Cloudflare 会自动配置 DNS。

## 内容管理（GitHub 文件方式）

所有内容都在 `data/` 目录的 JSON 文件里，直接改文件、commit、push，Cloudflare 会自动重新部署。

### 添加商品

编辑 `data/products.json`，在 `series[].products` 数组中添加：

```json
{
  "id": "bu-tee-002",
  "name": "商品名称",
  "category": "tee",
  "price": 299,
  "currency": "CNY",
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["黑色"],
  "status": "available",
  "image": "assets/products/tee-002.jpg",
  "description": "商品描述"
}
```

`status` 可选值：`coming-soon`（即将发布）、`available`（在售）、`sold-out`（售罄）

### 添加音乐

编辑 `data/music.json`，在 `tracks` 数组中添加，`audioUrl` 填音频文件路径（如 `assets/music/track-01.mp3`）。

### 添加漫画章节

编辑 `data/comics.json`，在 `chapters` 数组中添加。

### 配置淘宝/抖音店铺链接

打开 `shop.html`，搜索「淘宝链接」「抖音链接」，把对应 `<a>` 标签的 `href="#"` 替换为你的店铺实际地址。

## 共创板块（用户建议）

`suggest.html` 提供用户建议提交功能：
- 用户可选择建议类型（产品设计/面料质感/音乐/漫画等），填写建议内容
- 提交后**不显示在网站上**，仅品牌团队在管理后台可见
- 目前前端模拟提交，后端接好后取消 `suggest.html` 中 `fetch('/api/suggest')` 的注释

## 手机登录

所有页面右上角「登录」按钮，点击弹出手机号登录弹窗：
- 步骤1：输入手机号 → 获取验证码
- 步骤2：输入验证码 → 登录成功
- 登录状态存 localStorage，刷新保留
- **后端待接**：`/api/send-code`（发送验证码）和 `/api/verify-code`（验证），目前前端模拟任意验证码通过

## 管理后台

访问 `https://beatultimate.space/admin.html`，输入 `ADMIN_PASSWORD` 登录。

功能：
- **用户建议**：查看共创板块提交的所有建议（待接 `/api/suggest`）
- **联系留言**：查看用户通过首页联系表单提交的留言
- **邮件订阅**：查看所有订阅邮箱

数据存储在 Cloudflare KV 中。

## API 接口（后端暂未启用，结构已预留）

| 接口 | 方法 | 说明 | 状态 |
|------|------|------|------|
| `/api/contact` | POST | 提交联系表单 | 已实现 |
| `/api/subscribe` | POST | 邮件订阅 | 已实现 |
| `/api/suggest` | POST | 提交用户建议 | 待实现 |
| `/api/send-code` | POST | 发送手机验证码 | 待实现 |
| `/api/verify-code` | POST | 验证手机验证码 | 待实现 |
| `/api/admin-login` | POST | 管理后台登录 | 已实现 |
| `/api/admin?type=suggests` | GET | 建议列表（需登录） | 待实现 |
| `/api/admin?type=contacts` | GET | 联系留言列表（需登录） | 已实现 |
| `/api/admin?type=subscribes` | GET | 订阅列表（需登录） | 已实现 |

## 本地开发

```bash
npm install
npm run dev
```

然后访问 `http://localhost:8788`

> 本地开发时 KV 需要用 `--kv BEAT_KV` 参数绑定，或直接在 Cloudflare 上测试。

## 技术栈

- **前端**：原生 HTML/CSS/JS + Tailwind CSS v3 CDN
- **后端**：Cloudflare Pages Functions（边缘函数）
- **数据库**：Cloudflare KV（订单/订阅/留言存储）
- **内容管理**：GitHub JSON 文件
- **部署**：Cloudflare Pages + GitHub 自动部署
