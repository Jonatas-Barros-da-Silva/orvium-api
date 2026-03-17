
# Platform Monorepo

This is a full-stack monorepo containing a React frontend, an Express API backend, and a PocketBase database.

## Emergency: npm E404 Error

If you encounter an error like `npm ERR! code E404` or `npm ERR! 404 Not Found - GET https://registry.npmjs.org/@orvium%2fintegration-sdk`, it means there are leftover private package references in the project.

**To fix this immediately:**
1. Make the emergency cleanup script executable:
   