/* ================================================================
   Beat Ultimate 共享 JS — 购物车管理 + 数据加载 + 通用工具
   ================================================================ */

// ============ 购物车管理（localStorage） ============
const Cart = {
  KEY: 'beatult_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateBadge();
  },

  add(product, size = '', quantity = 1) {
    const items = this.get();
    const key = product.id + (size ? ':' + size : '');
    const existing = items.find((i) => i.key === key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        key,
        id: product.id,
        name: product.name,
        price: product.price,
        size,
        quantity,
        image: product.image || ''
      });
    }
    this.save(items);
    return items;
  },

  remove(key) {
    const items = this.get().filter((i) => i.key !== key);
    this.save(items);
    return items;
  },

  updateQty(key, quantity) {
    const items = this.get();
    const item = items.find((i) => i.key === key);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.save(items);
    }
    return items;
  },

  clear() {
    this.save([]);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = this.count();
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
};

// ============ 数据加载 ============
const Data = {
  async load(type) {
    const urls = {
      products: 'data/products.json',
      music: 'data/music.json',
      comics: 'data/comics.json'
    };
    try {
      const res = await fetch(urls[type]);
      if (!res.ok) throw new Error('加载失败');
      return await res.json();
    } catch (err) {
      console.warn('数据加载失败:', type, err);
      return null;
    }
  },

  async products() { return this.load('products'); },
  async music() { return this.load('music'); },
  async comics() { return this.load('comics'); }
};

// ============ 通用工具 ============
const Utils = {
  formatPrice(n) {
    return '¥' + Number(n).toFixed(0);
  },

  // 价格格式化：¥299
  money(n) {
    return '¥' + Math.round(n);
  },

  // 状态文本
  statusText(s) {
    const map = {
      'coming-soon': '即将发布',
      'available': '在售',
      'sold-out': '已售罄',
      'pending': '待付款',
      'paid': '已付款',
      'shipped': '已发货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return map[s] || s;
  },

  // 状态颜色类
  statusClass(s) {
    const map = {
      'coming-soon': 'text-amber-400',
      'available': 'text-green-400',
      'sold-out': 'text-red-400',
      'pending': 'text-amber-400',
      'paid': 'text-blue-400',
      'shipped': 'text-purple-400',
      'completed': 'text-green-400',
      'cancelled': 'text-gray-500'
    };
    return map[s] || 'text-gray-400';
  }
};

// 页面加载时更新购物车角标
document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
