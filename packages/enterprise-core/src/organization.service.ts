
import { Organization } from './enterprise.types.js';

export class OrganizationService {
  private organizations: Organization[] = [];

  /**
   * Creates a new organization with the given name and owner.
   */
  public createOrganization(name: string, ownerId: string): Organization {
    if (!name || name.trim() === '') {
      throw new Error('Organization name is required');
    }
    if (!ownerId) {
      throw new Error('Owner ID is required');
    }

    const now = new Date().toISOString();
    const org: Organization = {
      id: this.generateId('org_'),
      name,
      ownerId,
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    this.organizations.push(org);
    return org;
  }

  /**
   * Retrieves an organization by its ID.
   */
  public getOrganization(organizationId: string): Organization | null {
    return this.organizations.find(org => org.id === organizationId) || null;
  }

  /**
   * Updates an existing organization's properties.
   */
  public updateOrganization(organizationId: string, updates: Partial<Pick<Organization, 'name' | 'metadata'>>): Organization | null {
    const index = this.organizations.findIndex(org => org.id === organizationId);
    if (index === -1) return null;

    const updatedOrg = {
      ...this.organizations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.organizations[index] = updatedOrg;
    return updatedOrg;
  }

  /**
   * Deletes an organization by its ID.
   */
  public deleteOrganization(organizationId: string): boolean {
    const initialLength = this.organizations.length;
    this.organizations = this.organizations.filter(org => org.id !== organizationId);
    return this.organizations.length < initialLength;
  }

  /**
   * Retrieves all organizations owned by a specific user.
   */
  public getUserOrganizations(userId: string): Organization[] {
    return this.organizations.filter(org => org.ownerId === userId);
  }

  /**
   * Retrieves statistics for a specific organization.
   * Note: In a real implementation, this would query related collections.
   */
  public getOrganizationStats(organizationId: string): { workspaceCount: number; memberCount: number; integrationCount: number; automationCount: number } {
    // Mock implementation for stats
    return {
      workspaceCount: 0,
      memberCount: 1, // At least the owner
      integrationCount: 0,
      automationCount: 0
    };
  }

  /**
   * Generates a unique ID with a specific prefix.
   */
  private generateId(prefix: string): string {
    return `${prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}
