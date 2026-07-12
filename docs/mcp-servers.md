# MCP Servers

This document describes the MCP (Model Context Protocol) servers configured for
the coding agent. Configuration lives in `.kiro/mcp/mcp.json`.

## Servers

### filesystem

- **Command**: `npx -y @modelcontextprotocol/server-filesystem .`
- **Purpose**: Read/write access to the monorepo for generating specs, code, and docs.

### github

- **Command**: `npx -y @modelcontextprotocol/server-github`
- **Env**: `GITHUB_PERSONAL_ACCESS_TOKEN` (from `.env`)
- **Purpose**: Create branches, PRs, and automated review comments per
  `04-pull-requests.md`.

### postgres

- **Command**: `npx -y @modelcontextprotocol/server-postgres ${SUPABASE_DB_URL}`
- **Purpose**: Query/validate the real database schema (Supabase Postgres) before
  generating migrations. Read-only mode for spec design/validation; actual
  migrations are run via `scripts/`, not from the agent in production.

## Environment variables

`${VAR}` values are resolved from the `.env` of the environment where the agent
runs. Tokens are never hardcoded in `mcp.json`.

## Adding a new MCP server

1. Add the server config to `.kiro/mcp/mcp.json`.
2. Document it in this file.
3. If it requires new env vars, add them to `.kiro/steerings/09-environment-variables.md`.
