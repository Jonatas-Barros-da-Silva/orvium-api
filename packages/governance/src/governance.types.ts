
export type GovernanceScope = 'integration' | 'developer' | 'workspace' | 'platform';
export type RateLimitWindow = 'minute' | 'hour' | 'day' | 'month';
export type AbuseReason = 'execution_loop' | 'burst_detected' | 'failure_storm' | 'quota_exceeded' | 'rate_limit_exceeded';

export interface ExecutionContext {
  integrationId: string;
  developerId: string;
  workspaceId: string;
  action: string;
  timestamp: Date;
}

export interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  maxConcurrent: number;
}

export interface QuotaConfig {
  maxExecutionsPerMonth: number;
  maxExecutionsPerDay: number;
  maxConcurrentExecutions: number;
}

export interface GovernanceMetrics {
  currentMinute: number;
  currentHour: number;
  currentDay: number;
  concurrent: number;
}

export interface GovernanceResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  metrics?: GovernanceMetrics;
}

export interface ExecutionCounter {
  scopeType: GovernanceScope;
  scopeId: string;
  window: RateLimitWindow;
  count: number;
  windowStart: Date;
}

export interface AbuseFlag {
  integrationId: string;
  reason: AbuseReason;
  blockedUntil: Date;
}
