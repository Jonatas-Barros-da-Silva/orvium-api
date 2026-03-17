
import React from 'react';
import { Helmet } from 'react-helmet';
import { DocSidebar } from '@/components/developer/DocSidebar.jsx';
import { DocSection } from '@/components/developer/DocSection.jsx';
import { CodeExampleBlock } from '@/components/developer/CodeExampleBlock.jsx';

export default function GettingStartedPage() {
  return (
    <div className="flex min-h-[100dvh] bg-background">
      <Helmet>
        <title>Getting Started | Developer Docs</title>
      </Helmet>
      
      <DocSidebar />
      
      <main className="flex-1 px-6 py-12 md:px-12 lg:px-24 overflow-y-auto">
        <div className="doc-content-wrapper">
          <h1 className="doc-heading-1">Getting Started</h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-[65ch] leading-relaxed">
            Welcome to the Platform Developer Documentation. Learn how to build, test, and publish integrations that extend the platform's capabilities.
          </p>

          <DocSection id="overview" title="Platform Overview">
            <p className="doc-paragraph">
              The integration platform is built on an event-driven architecture. Integrations act as bridges between the platform and external services (like Stripe, Slack, or custom APIs). 
            </p>
            <p className="doc-paragraph">
              As a developer, you create <strong>Adapters</strong> using our SDK. These adapters define <strong>Capabilities</strong> (e.g., "Payment Processing") and <strong>Actions</strong> (e.g., "Create Charge").
            </p>
          </DocSection>

          <DocSection id="prerequisites" title="Prerequisites">
            <ul className="doc-list">
              <li>Node.js v18 or higher</li>
              <li>A Developer Account on the platform</li>
              <li>Basic knowledge of JavaScript/TypeScript and REST APIs</li>
            </ul>
          </DocSection>

          <DocSection id="quickstart" title="Quickstart Guide">
            <p className="doc-paragraph">
              To create your first integration, start by installing the Platform SDK in your local project.
            </p>
            
            <CodeExampleBlock 
              title="Terminal"
              language="bash"
              code="npm install @platform/integration-sdk"
            />

            <p className="doc-paragraph mt-6">
              Next, create a basic adapter class extending the SDK's base class:
            </p>

            <CodeExampleBlock 
              title="src/adapter.js"
              language="javascript"
              code={`import { BaseIntegrationAdapter } from '@platform/integration-sdk';

export default class HelloWorldAdapter extends BaseIntegrationAdapter {
  async initialize() {
    this.logger.info('Hello World Integration Initialized');
  }

  async executeAction(capability, action, payload) {
    if (capability === 'core' && action === 'ping') {
      return { status: 'success', message: 'pong', received: payload };
    }
    throw new Error(\`Unsupported action: \${action}\`);
  }
}`}
            />
          </DocSection>

          <DocSection id="lifecycle" title="Integration Lifecycle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="text-sm font-bold text-primary mb-2">1. Development</div>
                <p className="text-sm text-muted-foreground">Write your adapter code locally using the SDK. Define your configuration schemas and required permissions.</p>
              </div>
              <div className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="text-sm font-bold text-primary mb-2">2. Registration</div>
                <p className="text-sm text-muted-foreground">Create a new integration in the Developer Dashboard and upload your adapter code and metadata.</p>
              </div>
              <div className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="text-sm font-bold text-primary mb-2">3. Review</div>
                <p className="text-sm text-muted-foreground">Submit your integration for review. Our team will verify security, performance, and functionality.</p>
              </div>
              <div className="p-5 rounded-xl border border-border/50 bg-card">
                <div className="text-sm font-bold text-primary mb-2">4. Publication</div>
                <p className="text-sm text-muted-foreground">Once approved, your integration becomes available in the Marketplace for users to install.</p>
              </div>
            </div>
          </DocSection>
        </div>
      </main>
    </div>
  );
}
