
/**
 * Mask API key showing first 8 and last 4 characters
 * @param {string} key - Full API key
 * @returns {string} Masked key (e.g., "orvium_1********4a2b")
 */
export function maskApiKey(key) {
  if (!key || key.length < 12) return key;
  const prefix = key.substring(0, 8);
  const suffix = key.substring(key.length - 4);
  return `${prefix}${'*'.repeat(Math.min(key.length - 12, 20))}${suffix}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Format ISO date to readable format
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date (e.g., "Jan 15, 2024 10:30 AM")
 */
export function formatDate(date) {
  if (!date) return 'Never';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return d.toLocaleString('en-US', options);
}

/**
 * Format latency in milliseconds
 * @param {number} ms - Latency in milliseconds
 * @returns {string} Formatted latency (e.g., "150ms", "1.5s")
 */
export function formatLatency(ms) {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Calculate error rate from logs
 * @param {Array} logs - Array of log objects with status_code
 * @returns {number} Error rate percentage (0-100)
 */
export function calculateErrorRate(logs) {
  if (!logs || logs.length === 0) return 0;
  const errorCount = logs.filter(log => log.status_code >= 400).length;
  return ((errorCount / logs.length) * 100).toFixed(2);
}

/**
 * Generate a secure random API key
 * @returns {string} API key with orvium_ prefix
 */
export function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let key = 'orvium_';
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    key += chars[array[i] % chars.length];
  }
  
  return key;
}

/**
 * Get status badge variant based on status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Badge variant
 */
export function getStatusBadgeVariant(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 400 && statusCode < 500) return 'warning';
  if (statusCode >= 500) return 'destructive';
  return 'secondary';
}

/**
 * Format large numbers with K/M suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
