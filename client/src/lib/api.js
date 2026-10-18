
class ApiError extends Error {
  constructor(message, code, fields = {}, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  '/api'
).replace(/\/+$/, '');

export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('http')
    ? endpoint
    : `/${endpoint.replace(/^\/?api\/?/, '').replace(/^\/+/, '')}`;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${cleanEndpoint === '/' ? '' : cleanEndpoint}`;

  const headers = { ...options.headers };
  const method = (options.method || 'GET').toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (
    (options.body !== undefined || isStateChanging) &&
    !(options.body instanceof FormData) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    method,
    headers,
    credentials: 'include'
  };

  if (
    config.body &&
    typeof config.body === 'object' &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  } else if (
    isStateChanging &&
    config.body === undefined &&
    headers['Content-Type'] === 'application/json'
  ) {
    config.body = '{}';
  }

  let response;

  try {
    response = await fetch(url, config);
  } catch {
    throw new ApiError(
      'Network error. Please check your connection and try again.',
      'NETWORK_ERROR',
      {},
      0
    );
  }

  if (response.status === 204) return null;

  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new ApiError(
        'Failed to download file.',
        'DOWNLOAD_FAILED',
        {},
        response.status
      );
    }
    return response.blob();
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data?.error || {};
    const code = errorData.code || 'UNKNOWN_ERROR';
    const message = errorData.message || response.statusText || 'Request failed';
    const fields = errorData.fields || {};

    if (
      response.status === 403 &&
      code === 'PASSWORD_CHANGE_REQUIRED' &&
      window.location.pathname !== '/staff/set-password'
    ) {
      window.location.href = '/staff/set-password';
    }

    throw new ApiError(message, code, fields, response.status);
  }

  return data;
}

export const api = {
  get: (url, options) =>
    apiFetch(url, { ...options, method: 'GET' }),

  post: (url, body, options) =>
    apiFetch(url, { ...options, method: 'POST', body }),

  put: (url, body, options) =>
    apiFetch(url, { ...options, method: 'PUT', body }),

  patch: (url, body, options) =>
    apiFetch(url, { ...options, method: 'PATCH', body }),

  delete: (url, bodyOrOptions, options) => {
    if (bodyOrOptions && (bodyOrOptions.headers || bodyOrOptions.body !== undefined)) {
      return apiFetch(url, { ...bodyOrOptions, method: 'DELETE' });
    }
    return apiFetch(url, { ...options, method: 'DELETE', body: bodyOrOptions });
  },

  download: (url, options) =>
    apiFetch(url, { ...options, method: 'GET', responseType: 'blob' })
};
