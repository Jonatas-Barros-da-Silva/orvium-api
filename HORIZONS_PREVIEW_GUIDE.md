
# Horizons Preview Troubleshooting Guide

This guide explains how to configure and troubleshoot the Vite development server to ensure it works correctly within the Horizons preview iframe.

## The Problem

By default, Vite binds the development server to `localhost` (`127.0.0.1`). While this works fine when accessing the app directly in your browser, it prevents external network interfaces (like the Horizons preview iframe) from accessing the development server, resulting in a "Connection Refused" or blank screen.

## The Solution

To allow the Horizons preview iframe to access the development server, Vite must be configured to listen on all network interfaces (`0.0.0.0`). Additionally, we enforce `strictPort: true` to ensure the server always runs on port `3000`, and we configure an API proxy to route `/api` requests to the backend server running on port `3001`.

### Required `vite.config.js` Configuration

