
export * from './governance.types';
export * from './governance.errors';
export * from './rate-limit.service';
export * from './quota.service';
export * from './abuse-detection.service';
export * from './governance.engine';

import { GovernanceEngine } from './governance.engine';
import { RateLimitService } from './rate-limit.service';
import { QuotaService } from './quota.service';
import { AbuseDetectionService } from './abuse-detection.service';

export function createGovernanceEngine(db: any): GovernanceEngine {
  return new GovernanceEngine(db);
}

export function createRateLimitService(db: any): RateLimitService {
  return new RateLimitService(db);
}

export function createQuotaService(db: any): QuotaService {
  return new QuotaService(db);
}

export function createAbuseDetectionService(db: any): AbuseDetectionService {
  return new AbuseDetectionService(db);
}
