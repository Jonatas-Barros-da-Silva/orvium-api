
/**
 * EXAMPLE: Stripe Integration Manifest
 * 
 * This file demonstrates a complete integration definition including
 * metadata, capabilities, actions, and configuration schemas.
 * This is the format expected when registering a new integration via the API.
 */

export const stripeIntegrationManifest = {
  app: {
    name: "Stripe Payments",
    slug: "stripe-payments",
    description: "Process payments, handle refunds, and manage subscriptions via Stripe.",
    category: "finance",
    icon_url: "https://example.com/icons/stripe.png"
  },
  version: {
    version_name: "1.0.0",
    adapter_type: "stripe_v1",
    is_stable: true,
    changelog: "Initial release with basic charge and refund capabilities."
  },
  config_schema: {
    type: "object",
    required: ["api_key"],
    properties: {
      api_key: {
        type: "string",
        title: "Secret API Key",
        description: "Your Stripe Secret Key (starts with sk_live_ or sk_test_)",
        format: "password"
      },
      currency: {
        type: "string",
        title: "Default Currency",
        description: "Three-letter ISO currency code",
        default: "usd",
        minLength: 3,
        maxLength: 3
      }
    }
  },
  capabilities: [
    {
      capability_key: "payments",
      name: "Payment Processing",
      description: "Process and manage financial transactions",
      actions: [
        {
          action_key: "create_charge",
          name: "Create Charge",
          description: "Charge a credit card or payment source",
          handler: "createCharge",
          input_schema: {
            type: "object",
            required: ["amount", "source_token"],
            properties: {
              amount: {
                type: "integer",
                description: "Amount in cents (e.g., 1000 for $10.00)",
                minimum: 50
              },
              source_token: {
                type: "string",
                description: "Stripe token (tok_...) or payment method ID"
              },
              description: {
                type: "string",
                description: "Statement description"
              }
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
          action_key: "refund_charge",
          name: "Refund Charge",
          description: "Refund a previously created charge",
          handler: "refundCharge",
          input_schema: {
            type: "object",
            required: ["charge_id"],
            properties: {
              charge_id: {
                type: "string",
                description: "The ID of the charge to refund"
              },
              amount: {
                type: "integer",
                description: "Optional partial refund amount in cents"
              }
            }
          },
          output_schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              refund_id: { type: "string" }
            }
          }
        }
      ]
    }
  ],
  permissions: [
    {
      permission_key: "network.outbound",
      description: "Required to communicate with api.stripe.com"
    }
  ]
};
