
/**
 * Example Stripe Integration Manifest
 * 
 * In a real project, you would import the helper for type safety:
 * import { defineIntegration } from '@orvium/integration-sdk';
 * 
 * export default defineIntegration({ ... });
 */

export default {
  name: "Stripe Payments",
  slug: "stripe-payments",
  version: "1.0.0",
  description: "Process payments, handle refunds, and manage customers via Stripe.",
  category: "finance",
  icon_url: "https://example.com/icons/stripe.png",
  authentication_type: "api_key",
  rate_limit: 100,
  timeout_ms: 15000,
  
  configSchema: {
    api_key: {
      type: "string",
      title: "Secret API Key",
      description: "Your Stripe Secret Key (starts with sk_live_ or sk_test_)",
      required: true,
      format: "password"
    },
    webhook_secret: {
      type: "string",
      title: "Webhook Signing Secret",
      description: "Used to verify incoming webhooks from Stripe",
      required: false,
      format: "password"
    }
  },

  capabilities: [
    {
      capability_key: "payments",
      name: "Payment Processing",
      description: "Process and manage financial transactions",
      actions: [
        {
          action_key: "create_payment",
          name: "Create Payment",
          description: "Charge a credit card or payment source",
          handler: "createPayment",
          input_schema: {
            type: "object",
            required: ["amount", "currency", "source"],
            properties: {
              amount: { type: "number" },
              currency: { type: "string" },
              source: { type: "string" },
              description: { type: "string" }
            }
          },
          output_schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              charge_id: { type: "string" },
              status: { type: "string" }
            }
          }
        },
        {
          action_key: "refund_payment",
          name: "Refund Payment",
          description: "Refund a previously created charge",
          handler: "refundPayment",
          input_schema: {
            type: "object",
            required: ["charge_id"],
            properties: {
              charge_id: { type: "string" },
              amount: { type: "number" }
            }
          }
        }
      ]
    },
    {
      capability_key: "customers",
      name: "Customer Management",
      description: "Manage Stripe customers",
      actions: [
        {
          action_key: "create_customer",
          name: "Create Customer",
          description: "Create a new customer in Stripe",
          handler: "createCustomer",
          input_schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: { type: "string" },
              name: { type: "string" }
            }
          }
        }
      ]
    }
  ]
};
