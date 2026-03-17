
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code2, Zap, Globe, Shield, ArrowRight, Terminal, BookOpen } from 'lucide-react';

export default function DeveloperPortalPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Code2,
      title: 'Powerful SDK',
      description: 'Build integrations quickly using our typed SDK with built-in validation, error handling, and logging.'
    },
    {
      icon: Zap,
      title: 'Event-Driven',
      description: 'React to platform events in real-time with webhooks and automated trigger rules.'
    },
    {
      icon: Globe,
      title: 'Marketplace Distribution',
      description: 'Publish your integrations to the marketplace and reach thousands of professional users.'
    },
    {
      icon: Shield,
      title: 'Secure by Default',
      description: 'Enterprise-grade security with OAuth2 support, encrypted credential storage, and granular permissions.'
    }
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <Helmet>
        <title>Developer Portal | Platform</title>
      </Helmet>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50 bg-muted/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Terminal className="w-4 h-4" />
              Platform Developer Hub
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6" style={{ letterSpacing: '-0.02em' }}>
              Build powerful integrations for the modern platform.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Extend platform capabilities, automate workflows, and connect with external services using our comprehensive developer tools and APIs.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8" onClick={() => navigate('/developers/dashboard')}>
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8" onClick={() => navigate('/developers/docs/getting-started')}>
                <BookOpen className="w-4 h-4 mr-2" /> Read the Docs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Everything you need to build</h2>
            <p className="text-muted-foreground text-lg">
              Our developer platform provides the tools, infrastructure, and distribution channels to make your integration successful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-8 border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Lifecycle Section */}
      <div className="py-24 bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">
                From code to marketplace in days, not months.
              </h2>
              <div className="space-y-8 mt-8">
                {[
                  { step: '01', title: 'Develop', desc: 'Write your integration logic using our Node.js SDK and test locally.' },
                  { step: '02', title: 'Configure', desc: 'Define capabilities, required permissions, and configuration schemas.' },
                  { step: '03', title: 'Submit', desc: 'Submit your integration for review by our platform team.' },
                  { step: '04', title: 'Publish', desc: 'Once approved, your integration is available to all platform users.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-2xl font-bold text-primary/30 font-mono">{item.step}</div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl blur-3xl" />
              <Card className="relative p-6 border-border/50 shadow-xl bg-gray-950 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">integration.js</span>
                </div>
                <pre className="text-sm text-slate-300 font-mono overflow-x-auto">
                  <code>{`import { BaseIntegrationAdapter } from '@platform/sdk';

export default class MyIntegration extends BaseIntegrationAdapter {
  async initialize() {
    this.logger.info('Integration initialized');
  }

  async executeAction(capability, action, payload) {
    if (capability === 'messaging' && action === 'send') {
      return await this.sendMessage(payload);
    }
    throw new Error('Unsupported action');
  }
}`}</code>
                </pre>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
