
import React from 'react';
import { Helmet } from 'react-helmet';
import { DocSidebar } from '@/components/developer/DocSidebar.jsx';
import { DocSection } from '@/components/developer/DocSection.jsx';
import { CodeExampleBlock } from '@/components/developer/CodeExampleBlock.jsx';

export default function SDKDocumentationPage() {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Helmet>
        <title>SDK Reference | Developer Docs</title>
      </Helmet>
      
      <DocSidebar />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24 overflow-y-auto">
        <div className="doc-content-wrapper">
          <h1 className="doc-heading-1">SDK Reference</h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-[65ch] leading-relaxed">
            The Integration SDK provides the core classes and utilities needed to build robust integrations for the platform.
          </p>

          <DocSection id="base-adapter" title="BaseIntegrationAdapter">
            <p className="doc-paragraph">
              Every integration must export a class that extends <code>BaseIntegrationAdapter</code>. This base class provides access to logging, configuration, and the execution context.
            </p>
            
            <CodeExampleBlock 
              title="Adapter Structure"
              language="javascript"
              code={`import { BaseIntegrationAdapter } from '@platform/integration-sdk';

export default class CustomAdapter extends BaseIntegrationAdapter {
  // Called when the integration is loaded into memory
  async initialize() {
    // Setup API clients, validate config
    const apiKey = this.config.api_key;
    this.client = new ExternalClient(apiKey);
  }

  // Called when the platform routes an action to this integration
  async executeAction(capability, action, payload) {
    this.logger.info(\`Executing \${capability}.\${action}\`);
    
    try {
      // Implementation logic
      return { success: true };
    } catch (error) {
      this.logger.error('Execution failed', error);
      throw error;
    }
  }
}`}
            />
          </DocSection>

          <DocSection id="context-api" title="Context API">
            <p className="doc-paragraph">
              Inside your adapter methods, you have access to the execution context via <code>this.context</code>. This provides information about the current workspace, execution ID, and environment.
            </p>
            <ul className="doc-list">
              <li><code>this.context.workspaceId</code>: The ID of the organization running the integration.</li>
              <li><code>this.context.executionId</code>: Unique ID for the current execution trace.</li>
              <li><code>this.context.environment</code>: 'production' or 'sandbox'.</li>
            </ul>
          </DocSection>

          <DocSection id="logging" title="Logging">
            <p className="doc-paragraph">
              Always use <code>this.logger</code> instead of <code>console.log</code>. The SDK logger automatically attaches trace IDs and routes logs to the platform's observability stack.
            </p>
            <CodeExampleBlock 
              language="javascript"
              code={`this.logger.debug('Verbose debugging info');
this.logger.info('Standard informational message');
this.logger.warn('Warning, something might be wrong');
this.logger.error('Critical failure', errorObject);`}
            />
          </DocSection>

          <DocSection id="config-schema" title="Configuration Schema">
            <p className="doc-paragraph">
              Integrations define their required configuration using JSON Schema. When a user installs your integration, the platform automatically generates a UI based on this schema.
            </p>
            <CodeExampleBlock 
              title="schema.json"
              language="json"
              code={`{
  "type": "object",
  "required": ["api_key", "region"],
  "properties": {
    "api_key": {
      "type": "string",
      "title": "API Key",
      "description": "Your external service API key",
      "format": "password"
    },
    "region": {
      "type": "string",
      "title": "Data Region",
      "enum": ["us-east", "eu-west"],
      "default": "us-east"
    }
  }
}`}
            />
          </DocSection>
        </div>
      </main>
    </div>
  );
}
