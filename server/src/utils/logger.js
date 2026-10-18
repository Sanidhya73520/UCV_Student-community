const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'token',
  'temporarypassword',
  'key',
  'authorization',
  'cookie',
  'secret',
  'smtp_key',
  'brevo_smtp_key'
]);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  const copy = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      copy[key] = redact(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

export const logger = {
  info: (msg, meta) => {
    if (process.env.NODE_ENV === 'test') return;
    if (meta) {
      console.log(`[INFO] ${msg}`, JSON.stringify(redact(meta)));
    } else {
      console.log(`[INFO] ${msg}`);
    }
  },
  warn: (msg, meta) => {
    if (meta) {
      console.warn(`[WARN] ${msg}`, JSON.stringify(redact(meta)));
    } else {
      console.warn(`[WARN] ${msg}`);
    }
  },
  error: (msg, err) => {
    const errorDetails = err instanceof Error
      ? { message: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined }
      : err;
    console.error(`[ERROR] ${msg}`, errorDetails);
  }
};
