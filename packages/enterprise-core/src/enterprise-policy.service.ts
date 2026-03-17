
import { EnterprisePolicy, PolicyType } from './enterprise.types.js';

export class EnterprisePolicyService {
  private policies: EnterprisePolicy[] = [];

  /**
   * Creates a new enterprise policy for an organization.
   */
  public createPolicy(organizationId: string, policyType: PolicyType, policyValue: any): EnterprisePolicy {
    if (!organizationId) throw new Error('Organization ID is required');
    
    this.validatePolicyValue(policyType, policyValue);

    // Check if policy already exists for this org and type
    const existing = this.getPolicyByType(organizationId, policyType);
    if (existing) {
      throw new Error(`Policy of type ${policyType} already exists for this organization`);
    }

    const now = new Date().toISOString();
    const policy: EnterprisePolicy = {
      id: this.generateId('policy_'),
      organizationId,
      policyType,
      policyValue,
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    this.policies.push(policy);
    return policy;
  }

  /**
   * Retrieves a policy by its ID.
   */
  public getPolicy(policyId: string): EnterprisePolicy | null {
    return this.policies.find(p => p.id === policyId) || null;
  }

  /**
   * Updates an existing policy's value.
   */
  public updatePolicy(policyId: string, policyValue: any): EnterprisePolicy | null {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index === -1) return null;

    const policy = this.policies[index];
    this.validatePolicyValue(policy.policyType, policyValue);

    const updatedPolicy = {
      ...policy,
      policyValue,
      updatedAt: new Date().toISOString()
    };

    this.policies[index] = updatedPolicy;
    return updatedPolicy;
  }

  /**
   * Deletes a policy by its ID.
   */
  public deletePolicy(policyId: string): boolean {
    const initialLength = this.policies.length;
    this.policies = this.policies.filter(p => p.id !== policyId);
    return this.policies.length < initialLength;
  }

  /**
   * Retrieves all policies for a specific organization.
   */
  public getOrganizationPolicies(organizationId: string): EnterprisePolicy[] {
    return this.policies.filter(p => p.organizationId === organizationId);
  }

  /**
   * Retrieves a specific policy type for an organization.
   */
  public getPolicyByType(organizationId: string, policyType: PolicyType): EnterprisePolicy | null {
    return this.policies.find(p => p.organizationId === organizationId && p.policyType === policyType) || null;
  }

  /**
   * Checks if a given value violates an organization's policy.
   */
  public checkPolicyViolation(organizationId: string, policyType: PolicyType, currentValue: any): { violated: boolean; policy?: EnterprisePolicy; message?: string } {
    const policy = this.getPolicyByType(organizationId, policyType);
    if (!policy) {
      return { violated: false }; // No policy means no violation
    }

    let violated = false;
    let message = '';

    switch (policyType) {
      case 'max_integrations':
      case 'max_executions':
        if (typeof currentValue === 'number' && currentValue > policy.policyValue) {
          violated = true;
          message = `Exceeded maximum allowed ${policyType === 'max_integrations' ? 'integrations' : 'executions'} (${policy.policyValue})`;
        }
        break;
      case 'allowed_integrations':
        if (Array.isArray(policy.policyValue) && !policy.policyValue.includes(currentValue)) {
          violated = true;
          message = `Integration ${currentValue} is not in the allowed list`;
        }
        break;
      case 'security_level':
        // Example: if policy requires 'high', and current is 'medium'
        const levels = ['low', 'medium', 'high', 'strict'];
        const requiredIdx = levels.indexOf(policy.policyValue);
        const currentIdx = levels.indexOf(currentValue);
        if (currentIdx < requiredIdx) {
          violated = true;
          message = `Security level ${currentValue} does not meet required level ${policy.policyValue}`;
        }
        break;
      // Add other policy checks as needed
    }

    return { violated, policy: violated ? policy : undefined, message: violated ? message : undefined };
  }

  /**
   * Validates that the policy value matches the expected format for the policy type.
   */
  private validatePolicyValue(policyType: PolicyType, value: any): void {
    switch (policyType) {
      case 'max_integrations':
      case 'max_executions':
      case 'data_retention':
        if (typeof value !== 'number' || value < 0) {
          throw new Error(`${policyType} requires a positive number value`);
        }
        break;
      case 'allowed_integrations':
      case 'ip_whitelist':
        if (!Array.isArray(value)) {
          throw new Error(`${policyType} requires an array value`);
        }
        break;
      case 'security_level':
        if (!['low', 'medium', 'high', 'strict'].includes(value)) {
          throw new Error('Invalid security level');
        }
        break;
      case 'encryption_required':
        if (typeof value !== 'boolean') {
          throw new Error('encryption_required requires a boolean value');
        }
        break;
    }
  }

  /**
   * Generates a unique ID with a specific prefix.
   */
  private generateId(prefix: string): string {
    return `${prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}
