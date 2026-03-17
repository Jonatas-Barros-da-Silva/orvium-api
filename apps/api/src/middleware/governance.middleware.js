
// DEPRECATED: Governance validation is now handled in the Automation Engine layer.
// See apps/api/src/engines/automation.engine.ts
export function createGovernanceMiddleware() {
  return (req, res, next) => {
    next();
  };
}
