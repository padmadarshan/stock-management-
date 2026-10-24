// StockWise Backend API Client

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8005/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('stockwise_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `API Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.detail || errData.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth
  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; user: { name: string; email: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem('stockwise_token', data.access_token);
    }
    return data;
  },

  register: async (name: string, email: string, password: string) => {
    const data = await request<{ access_token: string; user: { name: string; email: string; role: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) }
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem('stockwise_token', data.access_token);
    }
    return data;
  },

  getProfile: () => request<{ id: number; name: string; email: string; role: string }>('/auth/me'),

  // Products
  getProducts: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<any[]>(`/products${q}`);
  },

  getProductByBarcode: (barcode: string) => request<any>(`/products/barcode/${barcode}`),

  createProduct: (product: any) =>
    request<any>('/products', { method: 'POST', body: JSON.stringify(product) }),

  adjustStock: (productId: string, delta: number, type: string, reason?: string) =>
    request<any>(`/products/${productId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, type, reason }),
    }),

  // Movements & Transfers
  getMovements: () => request<any[]>('/inventory/movements'),

  recordStockIn: (product: string, qty: number, reason: string) =>
    request<any>('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify({ product, qty, type: 'Stock in', reason }),
    }),

  recordStockOut: (product: string, qty: number, reason: string) =>
    request<any>('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify({ product, qty, type: 'Stock out', reason }),
    }),

  getTransfers: () => request<any[]>('/inventory/transfers'),

  createTransfer: (product: string, from: string, to: string, quantity: number) =>
    request<any>('/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify({ product, from, to, quantity }),
    }),

  // Suppliers
  getSuppliers: () => request<any[]>('/suppliers'),

  createSupplier: (supplier: { name: string; email: string; phone?: string; leadTime?: number }) =>
    request<any>('/suppliers', { method: 'POST', body: JSON.stringify(supplier) }),

  deleteSupplier: (id: string) => request<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  // Purchase Orders
  getOrders: () => request<any[]>('/orders'),

  createOrder: (supplier: string, lines: { productId: string; quantity: number }[]) =>
    request<any>('/orders', { method: 'POST', body: JSON.stringify({ supplier, lines }) }),

  markOrdered: (orderId: string) =>
    request<any>(`/orders/${orderId}/mark-ordered`, { method: 'POST' }),

  receiveOrder: (orderId: string) =>
    request<any>(`/orders/${orderId}/receive`, { method: 'POST' }),

  // Taxonomy
  getCategories: () => request<string[]>('/taxonomy/categories'),
  createCategory: (name: string) =>
    request<string>('/taxonomy/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCategory: (name: string) =>
    request<void>(`/taxonomy/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  getBrands: () => request<string[]>('/taxonomy/brands'),
  createBrand: (name: string) =>
    request<string>('/taxonomy/brands', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteBrand: (name: string) =>
    request<void>(`/taxonomy/brands/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<{ threshold: number; expiry: number; dark: boolean }>('/settings'),
  updateSettings: (settings: { threshold: number; expiry: number; dark: boolean }) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // Analytics
  getDashboard: () => request<any>('/analytics/dashboard'),
  getAlerts: (threshold?: number) =>
    request<any[]>(`/analytics/alerts${threshold ? `?threshold=${threshold}` : ''}`),
  getExpiry: (days?: number) =>
    request<any[]>(`/analytics/expiry${days ? `?days=${days}` : ''}`),

  // AI Assistant
  askAiAssistant: (prompt: string) =>
    request<{ reply: string; suggestions?: string[]; recommendations?: any[] }>('/analytics/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};
