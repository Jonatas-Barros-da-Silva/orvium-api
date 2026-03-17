
# Database Migrations

This directory contains the schema migration system for the API. 

⚠️ **IMPORTANT: Migrations are NOT automatic.** The API runtime never modifies the database schema automatically on startup. All schema changes must be applied manually using the provided scripts.

## Overview

The migration system tracks applied migrations in the `schema_migrations` PocketBase collection. It ensures that database schema changes, collection creations, and data transformations are applied sequentially and safely.

## Environment Variables

To run migrations, you must have the following environment variables set in your `apps/api/.env` file:

