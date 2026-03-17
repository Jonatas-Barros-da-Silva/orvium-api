
# Developer Setup Guide

Welcome to the Orvium Monorepo! This guide will help you set up your local development environment.

## Project Structure

This repository uses npm workspaces to manage multiple applications and packages:

- `apps/web`: The React frontend application (Vite).
- `apps/api`: The Express.js backend API.
- `apps/pocketbase`: The PocketBase backend/database.
- `packages/integration-sdk`: Standalone SDK for building integrations.
- `packages/governance`: Internal package for rate limiting and abuse detection.

## Installation

We provide a script to ensure a clean installation, which is especially useful if you encounter dependency conflicts or `E404` errors related to local packages.

1. Make the script executable (macOS/Linux):
   