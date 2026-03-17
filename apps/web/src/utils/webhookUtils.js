
/**
 * Utility functions for Webhook management
 */

/**
 * Verifies a webhook signature (Client-side reference implementation)
 * In a real scenario, this runs on the receiving backend.
 * 
 * @param {string} payload - The raw JSON payload string
 * @param {string} timestamp - The X-Orvium-Timestamp header value
 * @param {string} signature - The X-Orvium-Signature header value
 * @param {string} secret - The webhook secret (whsec_...)
 * @returns {Promise<boolean>} - True if signature is valid
 */
export const verifyWebhookSignature = async (payload, timestamp, signature, secret) => {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const data = enc.encode(`${timestamp}.${payload}`);
    
    // Convert hex signature to Uint8Array
    const signatureBytes = new Uint8Array(
      signature.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))
    );
    
    return await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Formats a webhook payload for display or testing
 * 
 * @param {string} eventType - The type of event (e.g., 'event.created')
 * @param {object} eventData - The data object for the event
 * @param {string} eventId - The unique event ID
 * @returns {object} - The formatted payload
 */
export const formatWebhookPayload = (eventType, eventData, eventId = `evt_${Math.random().toString(36).substring(2, 14)}`) => {
  return {
    event_id: eventId,
    event_type: eventType,
    timestamp: new Date().toISOString(),
    data: eventData
  };
};

/**
 * Copies text to the clipboard
 * 
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} - True if successful
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
