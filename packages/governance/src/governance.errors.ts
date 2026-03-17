
import { GovernanceScope } from './governance.types';

export class GovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GovernanceError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GovernanceRejectedError extends GovernanceError {
  public reason: string;
  public retryAfter?: number;
  public scope?: GovernanceScope;
  public limitType?: string;

  constructor(message: string, reason: string, retryAfter?: number, scope?: GovernanceScope, limitType?: string) {
    super(message);
    this.name = 'GovernanceRejectedError';
    this.reason = reason;
    this.retryAfter = retryAfter;
    this.scope = scope;
    this.limitType = limitType;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RateLimitExceededError extends GovernanceRejectedError {
  constructor(reason: string, retryAfter: number, scope: GovernanceScope, limitType: string) {
    super(`Rate limit exceeded: ${reason}`, reason, retryAfter, scope, limitType);
    this.name = 'RateLimitExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuotaExceededError extends GovernanceRejectedError {
  constructor(reason: string, scope: GovernanceScope, limitType: string) {
    super(`Quota exceeded: ${reason}`, reason, undefined, scope, limitType);
    this.name = 'QuotaExceededError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AbuseDetectedError extends GovernanceRejectedError {
  constructor(reason: string, retryAfter: number) {
    super(`Abuse detected: ${reason}`, reason, retryAfter, 'integration', 'abuse');
    this.name = 'AbuseDetectedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GovernanceInternalError extends GovernanceError {
  constructor(message: string, public originalError?: any) {
    super(`Governance internal error: ${message}`);
    this.name = 'GovernanceInternalError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
