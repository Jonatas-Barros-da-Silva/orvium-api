
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export type OrganizationRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: string;
  metadata?: Record<string, any>;
}

export interface Permission {
  resource: string;
  action: string;
  roles: OrganizationRole[];
}

export const ROLE_PERMISSIONS: Record<OrganizationRole, { resource: string; action: string }[]> = {
  owner: [
    { resource: 'organization', action: '*' },
    { resource: 'workspace', action: '*' },
    { resource: 'integration', action: '*' },
    { resource: 'automation', action: '*' },
    { resource: 'member', action: '*' },
    { resource: 'policy', action: '*' },
    { resource: 'audit', action: '*' }
  ],
  admin: [
    { resource: 'workspace', action: '*' },
    { resource: 'integration', action: '*' },
    { resource: 'automation', action: '*' },
    { resource: 'member', action: '*' },
    { resource: 'audit', action: 'read' }
  ],
  developer: [
    { resource: 'integration', action: 'create' },
    { resource: 'integration', action: 'update' },
    { resource: 'integration', action: 'read' },
    { resource: 'automation', action: 'create' },
    { resource: 'automation', action: 'update' },
    { resource: 'automation', action: 'read' },
    { resource: 'workspace', action: 'read' }
  ],
  viewer: [
    { resource: 'organization', action: 'read' },
    { resource: 'workspace', action: 'read' },
    { resource: 'integration', action: 'read' },
    { resource: 'automation', action: 'read' },
    { resource: 'member', action: 'read' },
    { resource: 'policy', action: 'read' },
    { resource: 'audit', action: 'read' }
  ]
};

export type PolicyType = 
  | 'max_integrations' 
  | 'max_executions' 
  | 'allowed_integrations' 
  | 'security_level' 
  | 'ip_whitelist' 
  | 'data_retention' 
  | 'encryption_required';

export interface EnterprisePolicy {
  id: string;
  organizationId: string;
  policyType: PolicyType;
  policyValue: any;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export type AuditAction = 
  | 'integration_installed' 
  | 'integration_removed' 
  | 'integration_updated' 
  | 'automation_created' 
  | 'automation_deleted' 
  | 'automation_updated' 
  | 'policy_created' 
  | 'policy_updated' 
  | 'policy_deleted' 
  | 'permission_changed' 
  | 'member_invited' 
  | 'member_removed' 
  | 'workspace_created' 
  | 'workspace_deleted' 
  | 'organization_updated';

export type ResourceType = 
  | 'integration' 
  | 'automation' 
  | 'policy' 
  | 'permission' 
  | 'member' 
  | 'workspace' 
  | 'organization';

export interface AuditLog {
  id: string;
  organizationId: string;
  workspaceId?: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuditLogQuery {
  organizationId: string;
  workspaceId?: string;
  userId?: string;
  action?: AuditAction;
  resourceType?: ResourceType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
