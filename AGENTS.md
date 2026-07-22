# AGENTS.md — Rules for all coding agents

> This file is read by **every** coding agent (Kiro, Copilot, Cursor, OpenCode,
> Claude, etc.) before starting work. It contains hard rules that override any
> other instruction.

## ABSOLUTE RULE: `.env` is immutable

The file `.env` at the project root **cannot be touched, modified, or deleted**
by any agent under any circumstance. This rule is absolute and has no exceptions.

- **Do not read** `.env` to extract secrets or print them.
- **Do not write** to `.env` — no new variables, no updated values, no deletions.
- **Do not delete** `.env` or rename it.
- **Do not generate** `.env` files with real or placeholder values.

If a new environment variable is needed:

1. Document it in `.kiro/steerings/09-environment-variables.md`.
2. Add it to `.env.example` (with an empty or placeholder value, never a real
   secret).
3. The human developer must manually update `.env` on their machine.

**Enforcement during code review**: Any PR that modifies `.env` must be rejected.
See `.kiro/steerings/03-code-review.md`.

## Other rules

- Never commit secrets, API keys, or passwords to any file.
- All documentation is in English.
- Code is in English (variable names, comments, commit messages).
- Never merge to `main` without owner approval.
