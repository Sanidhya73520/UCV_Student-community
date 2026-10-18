/**
 * NoSQL Injection and Prototype Pollution Sanitizer Middleware
 * Recursively removes any object keys that begin with '$' or contain '.'
 * from req.body, req.query, and req.params, as well as prototype pollution vectors.
 */
function sanitize(target) {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitize(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      delete target[key];
    } else {
      target[key] = sanitize(target[key]);
    }
  }

  return target;
}

export function noSqlSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitize(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    sanitize(req.params);
  }
  if (req.query && typeof req.query === 'object') {
    sanitize(req.query);
  }
  next();
}
