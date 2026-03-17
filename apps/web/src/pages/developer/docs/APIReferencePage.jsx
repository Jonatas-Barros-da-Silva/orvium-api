
import React from 'react';
import { Helmet } from 'react-helmet';
import { DocSidebar } from '@/components/developer/DocSidebar.jsx';
import { DocSection } from '@/components/developer/DocSection.jsx';
import { APIEndpointCard } from '@/components/developer/APIEndpointCard.jsx';

export default function APIReferencePage() {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Helmet>
        <title>API Reference | Developer Docs</title>
      </Helmet>
      
      <DocSidebar />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24 overflow-y-auto">
        <div className="doc-content-wrapper">
          <h1 className="doc-heading-1">API Reference</h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-[65ch] leading-relaxed">
            Interact with the platform programmatically. Use these endpoints to manage integrations, trigger executions, and query logs.
          </p>

          <DocSection id="authentication" title="Authentication">
            <p className="doc-paragraph">
              All API requests require an API key passed in the <code>Authorization</code> header as a Bearer token.
            </p>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 font-mono text-sm mb-8">
              Authorization: Bearer pk_live_xxxxxxxxxxxxxxxxxxxx
            </div>
          </DocSection>

          <DocSection id="executions" title="Execution APIs">
            <APIEndpointCard 
              method="POST"
              endpoint="/api/executions/trigger"
              description="Trigger an integration action synchronously. The request will block until the execution completes or times out."
              parameters={[
                { name: 'integration_id', type: 'string', required: true, description: 'The ID of the installed integration' },
                { name: 'capability', type: 'string', required: true, description: 'The capability key (e.g., "messaging")' },
                { name: 'action', type: 'string', required: true, description: 'The action key (e.g., "send_message")' },
                { name: 'payload', type: 'object', required: true, description: 'The input payload matching the action schema' }
              ]}
              response={{
                success: true,
                execution_id: "exec_123456789",
                status: "completed",
                data: {
                  message_id: "msg_987",
                  delivered: true
                },
                latency_ms: 245
              }}
            />

            <APIEndpointCard 
              method="GET"
              endpoint="/api/executions/:execution_id"
              description="Retrieve the status and result of a specific execution."
              parameters={[
                { name: 'execution_id', type: 'string', required: true, description: 'Path parameter. The ID of the execution.' }
              ]}
              response={{
                success: true,
                data: {
                  id: "exec_123456789",
                  status: "completed",
                  started_at: "2026-03-14T10:00:00Z",
                  completed_at: "2026-03-14T10:00:00.245Z",
                  error: null
                }
              }}
            />
          </DocSection>

          <DocSection id="marketplace" title="Marketplace APIs">
            <APIEndpointCard 
              method="GET"
              endpoint="/api/integrations"
              description="List all available integrations in the public marketplace."
              parameters={[
                { name: 'category', type: 'string', required: false, description: 'Filter by category (e.g., "finance")' },
                { name: 'limit', type: 'integer', required: false, description: 'Pagination limit (default 50)' }
              ]}
              response={{
                success: true,
                data: [
                  {
                    id: "app_abc123",
                    name: "Stripe Payments",
                    category: "finance",
                    version: "1.2.0"
                  }
                ],
                meta: { total: 1, page: 1 }
              }}
            />
          </DocSection>
        </div>
      </main>
    </div>
  );
}
