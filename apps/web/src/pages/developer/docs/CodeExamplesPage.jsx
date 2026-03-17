
import React from 'react';
import { Helmet } from 'react-helmet';
import { DocSidebar } from '@/components/developer/DocSidebar.jsx';
import { DocSection } from '@/components/developer/DocSection.jsx';
import { CodeExampleBlock } from '@/components/developer/CodeExampleBlock.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CodeExamplesPage() {
  const stripeCode = `import { BaseIntegrationAdapter } from '@platform/integration-sdk';
import Stripe from 'stripe';

export default class StripeIntegration extends BaseIntegrationAdapter {
  async initialize() {
    if (!this.config.api_key) {
      throw new Error('Stripe API key is required');
    }
    this.stripe = new Stripe(this.config.api_key, {
      apiVersion: '2023-10-16',
    });
    this.logger.info('Stripe integration initialized');
  }

  async executeAction(capability, action, payload) {
    if (capability === 'payments') {
      switch (action) {
        case 'create_charge':
          return await this.createCharge(payload);
        case 'refund_charge':
          return await this.refundCharge(payload);
        default:
          throw new Error(\`Unsupported action: \${action}\`);
      }
    }
    throw new Error(\`Unsupported capability: \${capability}\`);
  }

  async createCharge(payload) {
    try {
      const charge = await this.stripe.charges.create({
        amount: payload.amount,
        currency: payload.currency || 'usd',
        source: payload.source_token,
        description: payload.description,
      });
      
      this.logger.info(\`Charge created successfully: \${charge.id}\`);
      return { success: true, charge_id: charge.id, status: charge.status };
    } catch (error) {
      this.logger.error('Stripe charge failed', error);
      throw error;
    }
  }
}`;

  const slackCode = `import { BaseIntegrationAdapter } from '@platform/integration-sdk';

export default class SlackIntegration extends BaseIntegrationAdapter {
  async initialize() {
    this.webhookUrl = this.config.webhook_url;
    if (!this.webhookUrl) {
      throw new Error('Slack Webhook URL is required');
    }
  }

  async executeAction(capability, action, payload) {
    if (capability === 'messaging' && action === 'send_notification') {
      return await this.sendNotification(payload);
    }
    throw new Error('Unsupported action');
  }

  async sendNotification(payload) {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: payload.message,
          blocks: payload.blocks
        })
      });

      if (!response.ok) {
        throw new Error(\`Slack API error: \${response.statusText}\`);
      }

      return { success: true, delivered: true };
    } catch (error) {
      this.logger.error('Failed to send Slack message', error);
      throw error;
    }
  }
}`;

  const webhookCode = `import { BaseIntegrationAdapter } from '@platform/integration-sdk';
import crypto from 'crypto';

export default class GenericWebhookIntegration extends BaseIntegrationAdapter {
  async initialize() {
    this.logger.info('Webhook integration ready');
  }

  async executeAction(capability, action, payload) {
    if (capability === 'http' && action === 'post') {
      const { url, data, secret } = payload;
      
      // Generate HMAC signature if secret provided
      const headers = { 'Content-Type': 'application/json' };
      if (secret) {
        const signature = crypto
          .createHmac('sha256', secret)
          .update(JSON.stringify(data))
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      return { 
        success: response.ok, 
        status: response.status 
      };
    }
    throw new Error('Unsupported action');
  }
}`;

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Helmet>
        <title>Code Examples | Developer Docs</title>
      </Helmet>
      
      <DocSidebar />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24 overflow-y-auto">
        <div className="doc-content-wrapper">
          <h1 className="doc-heading-1">Code Examples</h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-[65ch] leading-relaxed">
            Explore complete, working examples of integrations built with the Platform SDK. Use these as templates for your own projects.
          </p>

          <Tabs defaultValue="stripe" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="slack">Slack</TabsTrigger>
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stripe" className="mt-0 outline-none animate-in fade-in duration-500">
              <DocSection title="Stripe Payment Integration">
                <p className="doc-paragraph">
                  A complete integration that uses the official Stripe Node.js library to process payments and handle refunds. It demonstrates proper initialization, config validation, and error handling.
                </p>
                <CodeExampleBlock 
                  title="stripe-adapter.js"
                  language="javascript"
                  code={stripeCode}
                />
              </DocSection>
            </TabsContent>
            
            <TabsContent value="slack" className="mt-0 outline-none animate-in fade-in duration-500">
              <DocSection title="Slack Notifications">
                <p className="doc-paragraph">
                  A lightweight integration that sends messages to a Slack channel using Incoming Webhooks. Demonstrates making external HTTP requests using the native fetch API.
                </p>
                <CodeExampleBlock 
                  title="slack-adapter.js"
                  language="javascript"
                  code={slackCode}
                />
              </DocSection>
            </TabsContent>
            
            <TabsContent value="webhook" className="mt-0 outline-none animate-in fade-in duration-500">
              <DocSection title="Secure Webhook Sender">
                <p className="doc-paragraph">
                  A generic HTTP POST integration that demonstrates how to generate HMAC SHA-256 signatures for secure webhook delivery.
                </p>
                <CodeExampleBlock 
                  title="webhook-adapter.js"
                  language="javascript"
                  code={webhookCode}
                />
              </DocSection>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
