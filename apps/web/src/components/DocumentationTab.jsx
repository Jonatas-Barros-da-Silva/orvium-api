
import React from 'react';
import { Book, Key, Shield, Zap, Webhook, AlertCircle, TrendingUp, Clock, Code, Fingerprint, RefreshCw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';

const CodeBlock = ({ children, language = 'bash' }) => (
  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
    <code>{children}</code>
  </pre>
);

export default function DocumentationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">API Documentation</h2>
        <p className="text-sm text-slate-600 mt-1">Complete guide to using the Orvium API</p>
      </div>

      <Accordion type="multiple" defaultValue={['webhooks']} className="space-y-4">
        {/* Getting Started */}
        <AccordionItem value="getting-started" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Book className="w-5 h-5 text-primary" />
              <span className="font-semibold">Getting Started</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Overview</h3>
              <p className="text-slate-700 leading-relaxed">
                The Orvium API provides programmatic access to your financial data, wallet balances, transactions, and payout management. 
                All API requests require authentication using API keys.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Base URL</h3>
              <CodeBlock>https://api.orvium.com/v1</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Quick Start</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Create an API key in the API Keys tab</li>
                <li>Include the key in the Authorization header of your requests</li>
                <li>Make your first API call to test connectivity</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Authentication */}
        <AccordionItem value="authentication" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Authentication</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">API Key Format</h3>
              <p className="text-slate-700 mb-2">API keys follow this format:</p>
              <CodeBlock>orvium_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Header Usage</h3>
              <p className="text-slate-700 mb-2">Include your API key in the Authorization header:</p>
              <CodeBlock>Authorization: Bearer orvium_your_api_key_here</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Example Request</h3>
              <CodeBlock>{`curl -X GET https://api.orvium.com/v1/wallet/balance \\
  -H "Authorization: Bearer orvium_your_api_key_here" \\
  -H "Content-Type: application/json"`}</CodeBlock>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Request Identification */}
        <AccordionItem value="request-identification" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-primary" />
              <span className="font-semibold">Request Identification</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Overview</h3>
              <p className="text-slate-700 mb-3">
                Every API request is automatically assigned a unique identifier. This Request ID is crucial for tracking, debugging, and support inquiries. It is returned in both the response headers and error bodies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Request ID Format</h3>
              <p className="text-slate-700 mb-2">Request IDs follow a specific format consisting of a prefix and a 12-character hex string:</p>
              <CodeBlock>req_a1b2c3d4e5f6</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Accessing the Request ID</h3>
              <p className="text-slate-700 mb-3">
                The Request ID is always included in the <code className="bg-slate-100 px-1 py-0.5 rounded text-sm">X-Request-ID</code> HTTP response header.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rate Limiting */}
        <AccordionItem value="rate-limiting" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Rate Limiting</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Rate Limit Rules</h3>
              <p className="text-slate-700 mb-3">To ensure platform stability, API requests are subject to the following limits:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-50 border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-slate-500 mb-1">Per Workspace</div>
                    <div className="text-2xl font-bold text-slate-900">10,000 <span className="text-base font-normal text-slate-600">req / hour</span></div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-slate-500 mb-1">Per API Key</div>
                    <div className="text-2xl font-bold text-slate-900">5,000 <span className="text-base font-normal text-slate-600">req / hour</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Webhooks */}
        <AccordionItem value="webhooks" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <Webhook className="w-5 h-5 text-primary" />
              <span className="font-semibold">Webhooks</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-8">
            {/* 1. Overview */}
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Overview</h3>
              <p className="text-slate-700 mb-3">
                Webhooks allow you to build or set up integrations that subscribe to certain events on Orvium. When one of those events is triggered, we'll send an HTTP POST payload to the webhook's configured URL.
              </p>
            </div>

            {/* 2. Creating Webhooks */}
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Creating Webhooks</h3>
              <p className="text-slate-700 mb-3">
                You can create webhooks via the Developer Dashboard or the API. All webhook endpoints <strong>must use HTTPS</strong>.
              </p>
              <CodeBlock language="bash">{`curl -X POST https://api.orvium.com/v1/webhooks/subscriptions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_types": ["event.created"],
    "endpoint_url": "https://your-domain.com/webhooks"
  }'`}</CodeBlock>
            </div>

            {/* 3. Payload Format */}
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Webhook Payload Format</h3>
              <p className="text-slate-700 mb-3">Every webhook delivery contains a standard JSON payload structure:</p>
              <CodeBlock language="json">{`{
  "event_id": "evt_1234567890ab",
  "event_type": "wallet.updated",
  "timestamp": "2024-03-13T10:30:00Z",
  "data": {
    "wallet_id": "wallet_123",
    "available_balance": 1250.50,
    "pending_balance": 320.00
  }
}`}</CodeBlock>
            </div>

            {/* 4. Security */}
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Webhook Security</h3>
              <p className="text-slate-700 mb-3">
                To verify that a webhook was actually sent by Orvium, we include an HMAC-SHA256 signature in the headers.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2"><Badge variant="outline">X-Orvium-Event</Badge><span className="text-sm">The event type</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline">X-Orvium-Timestamp</Badge><span className="text-sm">ISO 8601 timestamp</span></div>
                <div className="flex items-center gap-2"><Badge variant="outline">X-Orvium-Signature</Badge><span className="text-sm">HMAC-SHA256 signature</span></div>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-2">Verification Example (Node.js):</p>
              <CodeBlock language="javascript">{`const crypto = require('crypto');

function verifySignature(payload, timestamp, signature, secret) {
  const data = \`\${timestamp}.\${payload}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
    
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}`}</CodeBlock>
            </div>

            {/* 5. Events */}
            <div>
              <h3 className="font-semibold text-lg mb-2">5. Available Events</h3>
              <div className="grid gap-3">
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4">
                    <Badge className="mb-2">event.repasse.created</Badge>
                    <p className="text-sm text-slate-600">Triggered when a new repasse calculation is generated.</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4">
                    <Badge className="mb-2">event.wallet.updated</Badge>
                    <p className="text-sm text-slate-600">Triggered when a professional's wallet balance changes.</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4">
                    <Badge className="mb-2">event.payout.created</Badge>
                    <p className="text-sm text-slate-600">Triggered when a payout request is initiated.</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-4">
                    <Badge className="mb-2">event.payout.sent</Badge>
                    <p className="text-sm text-slate-600">Triggered when a payout is successfully processed.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 6. Retry Logic */}
            <div>
              <h3 className="font-semibold text-lg mb-2">6. Retry Logic</h3>
              <p className="text-slate-700 mb-3">
                If your endpoint returns a non-2xx status code or times out (30s), we will retry delivery up to 10 times using exponential backoff:
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">1 min</Badge>
                <Badge variant="secondary">5 mins</Badge>
                <Badge variant="secondary">30 mins</Badge>
                <Badge variant="secondary">2 hours</Badge>
                <Badge variant="secondary">12 hours</Badge>
                <Badge variant="secondary">24 hours</Badge>
              </div>
            </div>

            {/* 7. Best Practices */}
            <div>
              <h3 className="font-semibold text-lg mb-2">7. Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li><strong>Respond Quickly:</strong> Acknowledge receipt with a 2xx status code before performing heavy processing.</li>
                <li><strong>Verify Signatures:</strong> Always verify the <code className="text-xs bg-slate-100 px-1 rounded">X-Orvium-Signature</code> to ensure the payload is authentic.</li>
                <li><strong>Idempotency:</strong> Use the <code className="text-xs bg-slate-100 px-1 rounded">event_id</code> to prevent processing the same event twice in case of retries.</li>
                <li><strong>Handle Retries:</strong> Ensure your system can handle receiving events out of order.</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Event Replay & Webhook Redelivery */}
        <AccordionItem value="event-replay" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-primary" />
              <span className="font-semibold">Event Replay & Webhook Redelivery</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-8">
            {/* 1. Overview */}
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Overview</h3>
              <p className="text-slate-700 mb-3">
                Orvium provides two distinct mechanisms for recovering from missed events or testing your integration:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li><strong>Webhook Redelivery:</strong> Retries a specific, single delivery attempt to a specific endpoint. Useful when your server had a temporary hiccup.</li>
                <li><strong>Event Replay:</strong> Takes a historical event and broadcasts it again to <em>all</em> currently active subscriptions listening for that event type. Useful when you've added a new endpoint and want to populate it with past data.</li>
              </ul>
            </div>

            {/* 2. Webhook Redelivery */}
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Webhook Redelivery</h3>
              <p className="text-slate-700 mb-3">
                You can manually trigger a retry for any past webhook delivery log. This creates a <strong>new log entry</strong> rather than modifying the old one.
              </p>
              <CodeBlock language="bash">{`curl -X POST https://api.orvium.com/v1/webhooks/logs/LOG_ID/retry \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
              <p className="text-slate-700 mt-3 mb-2">Response:</p>
              <CodeBlock language="json">{`{
  "status": "retry_triggered",
  "log_id": "LOG_ID",
  "new_log_id": "NEW_LOG_ID",
  "request_id": "req_a1b2c3d4e5f6"
}`}</CodeBlock>
            </div>

            {/* 3. Event Replay */}
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Event Replay</h3>
              <p className="text-slate-700 mb-3">
                Replaying an event will trigger deliveries to all active subscriptions that match the event type.
              </p>
              <CodeBlock language="bash">{`curl -X POST https://api.orvium.com/v1/events/EVENT_ID/replay \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</CodeBlock>
              <p className="text-slate-700 mt-3 mb-2">Response:</p>
              <CodeBlock language="json">{`{
  "status": "event_replayed",
  "event_id": "EVENT_ID",
  "deliveries_triggered": 2,
  "request_id": "req_a1b2c3d4e5f6"
}`}</CodeBlock>
            </div>

            {/* 4. Trigger Types */}
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Trigger Types</h3>
              <p className="text-slate-700 mb-3">
                Webhook delivery logs include a <code className="text-xs bg-slate-100 px-1 rounded">trigger_type</code> field to help you identify how the delivery was initiated:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-slate-100 text-slate-800">automatic</Badge>
                  <span className="text-sm text-slate-600">Standard delivery or automatic exponential backoff retry.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">manual_retry</Badge>
                  <span className="text-sm text-slate-600">Triggered via the Webhook Redelivery endpoint.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-100 text-green-800">event_replay</Badge>
                  <span className="text-sm text-slate-600">Triggered via the Event Replay endpoint.</span>
                </div>
              </div>
            </div>

            {/* 5. Best Practices */}
            <div>
              <h3 className="font-semibold text-lg mb-2">5. Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-slate-700">
                <li><strong>Use Redelivery for Single Failures:</strong> If only one endpoint failed to process an event, use Webhook Redelivery to fix it without spamming other healthy endpoints.</li>
                <li><strong>Use Replay for New Endpoints:</strong> When adding a new webhook subscription, use Event Replay to backfill recent events.</li>
                <li><strong>Implement Idempotency:</strong> Because events can be replayed or redelivered, your system must handle receiving the same <code className="text-xs bg-slate-100 px-1 rounded">event_id</code> multiple times gracefully.</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Error Handling */}
        <AccordionItem value="error-handling" className="bg-white rounded-xl shadow-sm border border-slate-200">
          <AccordionTrigger className="px-6 hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">Error Handling</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Status Codes</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success">200</Badge>
                  <span className="text-sm text-slate-700">Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">500</Badge>
                  <span className="text-sm text-slate-700">Server Error</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
