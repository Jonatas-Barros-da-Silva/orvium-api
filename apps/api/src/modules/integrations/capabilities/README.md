
# Integration Capability System

The Capability System provides a standardized way to define, discover, and execute specific features (capabilities) offered by third-party integrations. It acts as the bridge between the Automation Engine and the Integration Adapters.

## Overview

Instead of hardcoding integration features into the core API, integrations declare their **Capabilities** and **Actions**. 
- A **Capability** represents a logical grouping of features (e.g., `invoice_management`, `customer_sync`).
- An **Action** represents a specific executable operation within that capability (e.g., `create_invoice`, `fetch_customer`).

When a workspace installs an integration, the system automatically discovers and grants access to the capabilities provided by that integration version.

## Core Concepts

### 1. Capability
A high-level feature provided by an integration.
- **Key**: Unique identifier (e.g., `payment_processing`)
- **Schemas**: Optional JSON schemas defining standard inputs/outputs for the capability context.

### 2. Capability Action
A specific, executable method belonging to a capability.
- **Key**: Unique identifier within the capability (e.g., `charge_card`)
- **Handler**: The internal method name on the adapter class that executes this action.
- **Schemas**: JSON schemas defining the exact payload required to execute the action.

### 3. Workspace Capability
The resolved intersection of a Workspace's installed integrations and the active capabilities those integrations provide.

## Collection Schemas

The system relies on two primary PocketBase collections:

### `integration_capabilities`
- `integration_version_id` (Relation)
- `capability_key` (Text, Unique per version)
- `name` (Text)
- `description` (Text)
- `input_schema` (JSON)
- `output_schema` (JSON)
- `is_active` (Boolean)

### `capability_actions`
- `capability_id` (Relation)
- `action_key` (Text, Unique per capability)
- `name` (Text)
- `handler` (Text)
- `input_schema` (JSON)
- `output_schema` (JSON)
- `is_active` (Boolean)

## Services

### `CapabilityRegistryService`
Handles CRUD operations for capabilities and actions. Used primarily during integration registration and updates.
- `registerCapability(data)`
- `registerAction(data)`
- `listCapabilitiesForWorkspace(workspaceId)`

### `CapabilityResolver`
Used at runtime to discover what a workspace is allowed to do.
- `resolveWorkspaceCapabilities(workspaceId)`
- `resolveAction(workspaceId, capabilityKey, actionKey)`
- `hasCapability(workspaceId, capabilityKey)`

### `CapabilityUtils`
Static utility methods for formatting, parsing paths, and validating JSON schemas.

## Usage Examples

### Registering a Capability (During Integration Setup)
