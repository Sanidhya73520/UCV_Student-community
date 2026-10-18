class ApiError extends Error {
  constructor(message, code, fields = {}, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

export async function apiFetch(endpoint, options = {}) {
  // Strip redundant leading /api if present to prevent /api/api doubling
  const cleanEndpoint = endpoint.startsWith('http') ? endpoint : endpoint.replace(/^\/?api\/?/, '/');
  const url = cleanEndpoint.startsWith('http') ? cleanEndpoint : `/api${cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`}`;

  const headers = {
    ...options.headers
  };

  // Default Content-Type to JSON if sending body or if state-changing method and not FormData
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method?.toUpperCase());
  if ((options.body || isStateChanging) && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Always include cookies (ucv_sid, voterKey)
  };

  // Convert plain JS object to JSON string if needed, or default body to empty object for JSON POST/PUT/PATCH/DELETE
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  } else if (isStateChanging && config.body === undefined && headers['Content-Type'] === 'application/json') {
    config.body = '{}';
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError('Network error. Please check your connection and try again.', 'NETWORK_ERROR', {}, 0);
  }

  // Handle empty or 204 responses
  if (response.status === 204) {
    return null;
  }

  // If binary/blob requested (e.g. downloads)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new ApiError('Failed to download file.', 'DOWNLOAD_FAILED', {}, response.status);
    }
    return response.blob();
  }

  // Parse JSON
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

    // Special case: staff password change required
    if (response.status === 403 && code === 'PASSWORD_CHANGE_REQUIRED') {
      if (window.location.pathname !== '/staff/set-password') {
        window.location.href = '/staff/set-password';
      }
    }

    throw new ApiError(message, code, fields, response.status);
  }

  return data;
}

export const api = {
  get: (url, options) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiFetch(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => apiFetch(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => apiFetch(url, { ...options, method: 'PATCH', body }),
  delete: (url, bodyOrOptions, options) => {
    if (bodyOrOptions && (bodyOrOptions.headers || bodyOrOptions.body !== undefined)) {
      return apiFetch(url, { ...bodyOrOptions, method: 'DELETE' });
    }
    return apiFetch(url, { ...options, method: 'DELETE', body: bodyOrOptions });
  },
  download: (url, options) => apiFetch(url, { ...options, method: 'GET', responseType: 'blob' })
};
