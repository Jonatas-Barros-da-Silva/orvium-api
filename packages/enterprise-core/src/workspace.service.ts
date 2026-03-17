
import { Workspace } from './enterprise.types.js';

export class WorkspaceService {
  private workspaces: Workspace[] = [];

  /**
   * Creates a new workspace within an organization.
   */
  public createWorkspace(organizationId: string, name: string): Workspace {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    if (!name || name.trim() === '') {
      throw new Error('Workspace name is required');
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: this.generateId('ws_'),
      organizationId,
      name,
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    this.workspaces.push(workspace);
    return workspace;
  }

  /**
   * Retrieves a workspace by its ID.
   */
  public getWorkspace(workspaceId: string): Workspace | null {
    return this.workspaces.find(ws => ws.id === workspaceId) || null;
  }

  /**
   * Updates an existing workspace's properties.
   */
  public updateWorkspace(workspaceId: string, updates: Partial<Pick<Workspace, 'name' | 'metadata'>>): Workspace | null {
    const index = this.workspaces.findIndex(ws => ws.id === workspaceId);
    if (index === -1) return null;

    const updatedWorkspace = {
      ...this.workspaces[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.workspaces[index] = updatedWorkspace;
    return updatedWorkspace;
  }

  /**
   * Deletes a workspace by its ID.
   */
  public deleteWorkspace(workspaceId: string): boolean {
    const initialLength = this.workspaces.length;
    this.workspaces = this.workspaces.filter(ws => ws.id !== workspaceId);
    return this.workspaces.length < initialLength;
  }

  /**
   * Retrieves all workspaces belonging to a specific organization.
   */
  public getOrganizationWorkspaces(organizationId: string): Workspace[] {
    return this.workspaces.filter(ws => ws.organizationId === organizationId);
  }

  /**
   * Retrieves the hierarchy of workspaces for an organization including mock counts.
   */
  public getWorkspaceHierarchy(organizationId: string): { organizationId: string; workspaces: (Workspace & { integrationCount: number; automationCount: number; memberCount: number })[] } {
    const orgWorkspaces = this.getOrganizationWorkspaces(organizationId);
    
    const enrichedWorkspaces = orgWorkspaces.map(ws => ({
      ...ws,
      integrationCount: 0,
      automationCount: 0,
      memberCount: 0
    }));

    return {
      organizationId,
      workspaces: enrichedWorkspaces
    };
  }

  /**
   * Generates a unique ID with a specific prefix.
   */
  private generateId(prefix: string): string {
    return `${prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }
}
