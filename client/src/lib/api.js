let csrfToken = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/auth/csrf', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
    }
  } catch {
    // Graceful fallback
  }
  return csrfToken;
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  } else if (typeof options.body === 'string' && (options.body.startsWith('{') || options.body.startsWith('[')) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // State-changing requests need CSRF token header
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include'
  });

  // Keep CSRF token in sync from response header if returned
  const returnedCsrf = response.headers.get('X-CSRF-Token');
  if (returnedCsrf) {
    csrfToken = returnedCsrf;
  }

  if (response.status === 401 && !url.includes('/api/auth/login')) {
    // Notify window for auth state reset
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `Request failed with HTTP status ${response.status}` };
    }
    const error = new Error(errorData.message || errorData.error || 'API Request failed');
    error.status = response.status;
    error.details = errorData;
    throw error;
  }

  return response.json();
}

// Dedicated API service methods
export const api = {
  // Auth
  login: (credentials) => apiRequest('/api/auth/login', { method: 'POST', body: credentials }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiRequest('/api/auth/me'),

  // Customers
  getCustomers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/customers?${query}`);
  },
  getCustomer: (id) => apiRequest(`/api/customers/${id}`),
  createCustomer: (data) => apiRequest('/api/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => apiRequest(`/api/customers/${id}`, { method: 'PATCH', body: data }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/orders?${query}`);
  },
  getOrder: (id) => apiRequest(`/api/orders/${id}`),

  // Notes
  getNotes: (customerId) => apiRequest(`/api/notes/customer/${customerId}`),
  createNote: (customerId, content) => apiRequest(`/api/notes/customer/${customerId}`, { method: 'POST', body: { content } }),
  updateNote: (id, content) => apiRequest(`/api/notes/${id}`, { method: 'PATCH', body: { content } }),
  deleteNote: (id) => apiRequest(`/api/notes/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/tasks?${query}`);
  },
  createTask: (data) => apiRequest('/api/tasks', { method: 'POST', body: data }),
  updateTask: (id, data) => apiRequest(`/api/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask: (id) => apiRequest(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () => apiRequest('/api/templates'),
  getTemplate: (id) => apiRequest(`/api/templates/${id}`),
  createTemplate: (data) => apiRequest('/api/templates', { method: 'POST', body: data }),
  updateTemplate: (id, data) => apiRequest(`/api/templates/${id}`, { method: 'PATCH', body: data }),
  deleteTemplate: (id) => apiRequest(`/api/templates/${id}`, { method: 'DELETE' }),

  // Communications
  getCommunications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/communications?${query}`);
  },
  previewEmail: (data) => apiRequest('/api/communications/preview', { method: 'POST', body: data }),
  sendEmail: (data) => apiRequest('/api/communications/send', { method: 'POST', body: data }),

  // Workflows
  getWorkflows: () => apiRequest('/api/workflows'),
  getWorkflow: (id) => apiRequest(`/api/workflows/${id}`),
  createWorkflow: (data) => apiRequest('/api/workflows', { method: 'POST', body: data }),
  updateWorkflow: (id, data) => apiRequest(`/api/workflows/${id}`, { method: 'PATCH', body: data }),
  deleteWorkflow: (id) => apiRequest(`/api/workflows/${id}`, { method: 'DELETE' }),
  runWorkflow: (id) => apiRequest(`/api/workflows/${id}/run`, { method: 'POST' }),

  // Analytics
  getDashboardOverview: () => apiRequest('/api/analytics/overview'),
  getRetentionAnalytics: (timeRange = '90d') => apiRequest(`/api/analytics/retention?timeRange=${timeRange}`),

  // Action Agent
  getStoreRecommendations: () => apiRequest('/api/agent/recommendations'),
  getCustomerRecommendations: (customerId) => apiRequest(`/api/agent/recommendations/${customerId}`),
  queryAgent: (query) => apiRequest('/api/agent/query', { method: 'POST', body: { query } }),

  // Sync
  getSyncStatus: () => apiRequest('/api/sync/status'),
  triggerSync: () => apiRequest('/api/sync/woocommerce', { method: 'POST' })
};
