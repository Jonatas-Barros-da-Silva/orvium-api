
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'authorization', 
  'credential', 'api_key', 'access_token', 'refresh_token',
  'client_secret', 'auth'
];

const MAX_PAYLOAD_SIZE_BYTES = 100 * 1024; // 100KB

export function containsSensitiveData(key) {
  if (typeof key !== 'string') return false;
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive));
}

export function sanitizePayload(payload) {
  if (!payload) return payload;

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }

  if (typeof payload === 'object' && payload !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(payload)) {
      if (containsSensitiveData(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizePayload(value);
      }
    }
    return sanitized;
  }

  return payload;
}

export function getPayloadSize(payloadStr) {
  if (!payloadStr) return 0;
  return Buffer.byteLength(payloadStr, 'utf8');
}

export function truncatePayload(payloadStr, maxSize = MAX_PAYLOAD_SIZE_BYTES) {
  if (!payloadStr) return { truncatedStr: payloadStr, isTruncated: false };
  
  const size = getPayloadSize(payloadStr);
  if (size <= maxSize) {
    return { truncatedStr: payloadStr, isTruncated: false };
  }

  // Truncate and append warning
  const truncated = payloadStr.substring(0, maxSize) + '\n...[TRUNCATED: Exceeded maximum size]';
  return { truncatedStr: truncated, isTruncated: true };
}
