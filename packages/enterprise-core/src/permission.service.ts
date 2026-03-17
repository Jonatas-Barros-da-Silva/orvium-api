
import { OrganizationRole, Permission, ROLE_PERMISSIONS } from './enterprise.types.js';

export class PermissionService {
  
  /**
   * Checks if a specific role has permission to perform an action on a resource.
   */
  public hasPermission(userRole: OrganizationRole, resource: string, action: string): boolean {
    const rolePerms = ROLE_PERMISSIONS[userRole];
    if (!rolePerms) return false;

    return rolePerms.some(p => 
      (p.resource === resource || p.resource === '*') && 
      (p.action === action || p.action === '*')
    );
  }

  /**
   * Retrieves all permissions associated with a specific role.
   */
  public getPermissionsForRole(role: OrganizationRole): Permission[] {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    return rolePerms.map(p => ({
      resource: p.resource,
      action: p.action,
      roles: [role]
    }));
  }

  /**
   * Retrieves all permissions for a user based on their role.
   */
  public getUserPermissions(userRole: OrganizationRole): Permission[] {
    return this.getPermissionsForRole(userRole);
  }

  /**
   * Checks if a user role has ALL of the specified permissions.
   */
  public hasAllPermissions(userRole: OrganizationRole, requiredPermissions: { resource: string; action: string }[]): boolean {
    return requiredPermissions.every(req => this.hasPermission(userRole, req.resource, req.action));
  }

  /**
   * Checks if a user role has ANY of the specified permissions.
   */
  public hasAnyPermission(userRole: OrganizationRole, requiredPermissions: { resource: string; action: string }[]): boolean {
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.some(req => this.hasPermission(userRole, req.resource, req.action));
  }

  /**
   * Returns the role hierarchy with numeric levels for comparison.
   */
  public getRoleHierarchy(): { role: OrganizationRole; level: number }[] {
    return [
      { role: 'owner', level: 4 },
      { role: 'admin', level: 3 },
      { role: 'developer', level: 2 },
      { role: 'viewer', level: 1 }
    ];
  }

  /**
   * Checks if role1 is strictly higher in the hierarchy than role2.
   */
  public isRoleHigherThan(role1: OrganizationRole, role2: OrganizationRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    const level1 = hierarchy.find(h => h.role === role1)?.level || 0;
    const level2 = hierarchy.find(h => h.role === role2)?.level || 0;
    
    return level1 > level2;
  }
}
