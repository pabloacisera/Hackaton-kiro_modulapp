# Commit message conventions

Format (subject line, required):
`<type>(<optional scope>): <imperative summary, lowercase, no trailing period>`

Allowed types: feat, fix, chore, docs, test, refactor

Optional scope: short name of the feature/service (e.g. auth, payment-service, landing)

Body (required whenever the commit is not self-explanatory from its diff —
e.g. any change that encodes a business/product decision, resolves a
documented contradiction, or touches more than one unrelated concern):
- Blank line after the subject, then free-text explaining *why*, not just
  *what* (the diff already shows what).
- If the change follows an owner decision made outside the repo (like in
  conversation), say so explicitly: "Owner-confirmed: <decision>."
- Reference the relevant TASK-id, feature, or gap being closed, if any.

Atomicity rule: one commit = one logical change. If a fix touches two
unrelated concerns (e.g. syncing a counter AND resolving a business
decision in a different file), split it into two commits, each with its
own subject and body — do not bundle them just because they're small.

Examples:
- feat(auth): add JWT login endpoint
- fix(stock): prevent double deduction on order accept

  Race condition: two accept requests for the same order could both pass
  the stock check before either decremented it. Now wrapped in a DB
  transaction with row lock. Closes TASK-stock-6.
- docs: resolve i18n default-language contradiction

  00-project-context.md said English, feature-i18n-localization/specs.md
  said Spanish. Owner-confirmed: Spanish is the default; English/Spanish
  both still ship day one per i18n spec. Updated 00-project-context.md
  to match.
- chore: bootstrap project scaffolding and agent configuration
- docs: add cross-feature dependencies section to design template
