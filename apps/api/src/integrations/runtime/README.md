
# Integration Sandbox Runtime

The Integration Sandbox provides a safe, isolated execution environment for third-party integration adapters. It protects the core API from poorly written or malicious adapter code by enforcing strict execution constraints.

## Purpose

When executing external integration code, the system is vulnerable to:
1. **Infinite Loops**: Adapters that get stuck in `while(true)` loops.
2. **CPU Consumption**: Heavy synchronous operations that block the Node.js event loop.
3. **Unhandled Errors**: Exceptions that crash the main API process.
4. **Hanging Promises**: Network requests that never resolve or reject.

The `IntegrationSandbox` mitigates these risks by wrapping all adapter executions in a controlled `Promise.race` with strict timeouts and standardized error catching.

## Architecture

