# Contributing

Guidelines for human collaborators and their coding agents working on this
project. For the full agent rules, see `.kiro/steerings/00-project-context.md`.

---

## ⚡ COLLABORATIVE FLOW — THE PRIMARY WORKFLOW

**This is how we work. Multiple developers, one feature, microtask PRs.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLLABORATIVE FEATURE FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Owner creates branch in repo                                            │
│     └── <number>-feature-<feature-name>                                     │
│                                                                             │
│  2. Dev1 syncs                                                              │
│     └── git fetch upstream && git checkout <branch>                         │
│                                                                             │
│  3. Dev1 executes microtask                                                 │
│     └── Implements task, runs tests, creates PR                             │
│         PR title: [feature/X] TASK-1: <title>                               │
│                                                                             │
│  4. Owner reviews + merges PR                                               │
│     └── CI green → Agent reviews → Owner merges                             │
│                                                                             │
│  5. Dev2 syncs                                                              │
│     └── git fetch upstream && git pull upstream <branch>                     │
│                                                                             │
│  6. Dev2 executes microtask                                                 │
│     └── Implements task, runs tests, creates PR                             │
│         PR title: [feature/X] TASK-2: <title>                               │
│                                                                             │
│  7. Repeat until all microtasks complete                                    │
│     └── Feature done — no final PR needed (all already merged)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why this flow?

| Benefit | Explanation |
|---|---|
| **No fork coordination** | Everyone works from the same upstream branch |
| **Fast feedback** | Each microtask is reviewed immediately |
| **Easy rollback** | Revert one small PR if something breaks |
| **Clear ownership** | Each microtask has a single author |
| **No "passing the baton"** | Next developer just syncs and continues |

### Key rules
**Owner creates the branch** — developers do NOT create branches in their forks
2. **Each microtask = 1 PR** — no PRs for individual microtasks, no PRs for the entire feature
3. **Sync before starting** — always `git fetch upstream && git pull upstream <branch>`
4. **Owner merges** — only the owner can merge PRs to `main`
5. **PR title format** — `[feature/<name>] TASK-<n>: <short imperative summary>`

### Recovery: What if my repo falls behind?

If your repository gets out of sync, just pull the latest from upstream:

```bash
# Bring latest changes from the feature branch
git fetch upstream
git pull upstream <feature-branch>

# Or bring latest changes from main
git fetch upstream
git pull upstream main
```

**If you have uncommitted local changes:**
```bash
git fetch upstream
git stash                          # save your changes temporarily
git pull upstream <feature-branch>
git stash pop                      # restore your changes
```

**If you have commits in your fork not in upstream:**
```bash
git fetch upstream
git rebase upstream/<feature-branch>
git push --force-with-lease origin <feature-branch>  # push to your fork
```

**The rule**: always `git fetch upstream` first to see what changed, then `git pull` to integrate. If there are merge conflicts, resolve them before continuing.

---

## Getting started

1. **Fork** the repository (collaborators work via forks — only the owner
   can push directly to `main`).
2. Read `.kiro/steerings/00-project-context.md` (project context) and
   `.kiro/steerings/06-team-workflow.md` (how we work together).
3. Set up your local environment: copy `.env.example` to `.env`, fill in
   values, run `bash scripts/dev-up.sh`. See
   `.kiro/steerings/09-environment-variables.md` for what each variable does.

## Branching and PRs

- **Feature branches**: `<number>-feature-<feature-name>` (e.g.,
  `1-feature-admin-auth-core`). **Owner creates in the repo**, developers
  sync via upstream. Multiple developers can work on the same feature.
- **Issue branches**: `<number>-fix-issue-<id>-<slug>` (e.g.,
  `3-fix-issue-12-stock-double-deduction`).
- **Small fixes** (1-2 files, no tests): commit directly to `main` or the
  active feature branch — but ask the owner first.

### PR model options

| Model | When to use | PR count per feature |
|---|---|---|
| **1 microtask = 1 PR** | Collaborative features, pair programming | N microtasks = N PRs |
| **1 feature = 1 PR** | Single developer, feature complete | 1 PR per feature |

**Default**: Use "1 microtask = 1 PR" for collaborative work. Use "1 feature = 1 PR" when a single developer owns the entire feature.

**PR title format for microtasks**:
```
[feature/<feature-name>] TASK-<n>: <short imperative summary>
```

Examples:
- `[feature/admin-auth] TASK-auth-1: create User entity and migration`
- `[feature/admin-auth] TASK-auth-2: implement login endpoint`

**Only the owner merges.** See `.kiro/steerings/04-pull-requests.md` for the
full PR format and merge requirements.

## Keeping your fork in sync

Add the owner's repo as a second remote, once, right after forking:

```
git remote add upstream <owner-repo-url>
```

### Before starting a new microtask

```
git fetch upstream
git checkout <feature-branch>  # if branch exists
# OR
git checkout -b <feature-branch> upstream/<feature-branch>  # if first time
```

### Before opening your PR (single developer model)

```
git fetch upstream
git rebase upstream/main
```

If you had already pushed this branch to your own fork before rebasing,
force-push it (only ever to YOUR OWN fork, never to `upstream`):

```
git push --force-with-lease origin <your-branch>
```

`--force-with-lease` (not plain `--force`) protects you: if someone else
pushed to that same branch on your fork in the meantime, the push stops
instead of silently overwriting it.

### After a PR is merged — delete the branch

Once a PR is merged to `main`, delete the branch immediately (both remote
and local). Stale branches clutter the repo and confuse automation. This
applies to feature branches, issue branches, and any other temporary branch.

### After someone else's PR is merged (collaborative model)

When working on the same feature with other developers, after their PR is merged:

```
git fetch upstream
git pull upstream <feature-branch>
# Continue with your microtask
```

**If your agent runs this sync for you**, it must report back first: what
landed upstream since your last sync (commits/PRs, author, one-line
summary), which files those commits touched, and whether any of them
overlap with your current task (checked against `tasks.md` /
`docs/feature-status.md`). Do not let it rebase silently and move on to
your next step without showing you this first.

## What you can do

- Implement microtasks assigned to you in `tasks.md`.
- Run tests locally before opening a PR.
- Open PRs from your fork (one per microtask, or one per feature).
- Leave informal peer feedback on any PR (regardless of who worked on what).
- Create issue files in your fork and submit them as PRs (see
  `.kiro/steerings/02-issues-and-bugs.md`).

### Working on the same feature with multiple developers

When multiple developers work on the same feature:

1. Owner creates the feature branch in the repo
2. Each developer syncs via upstream before starting their microtask
3. Each microtask generates its own PR
4. After PR is merged, next developer syncs and continues
5. No "passing the baton" between forks — everyone works from the same upstream branch

## What your agent can do (and cannot)

Your coding agent (Kiro, Claude, Copilot, etc.) may work on your behalf, but
it **must** follow the same authorization points as the project's own agent
(see `.kiro/steerings/00-project-context.md` § Authorization points):

- **Never** assume business logic — always ask the owner.
- **Never** commit directly to `main` without owner confirmation.
- **Never** merge or approve PRs.
- **Never** skip the microtask decomposition rule (max half a day per task,
  max 2-3 files — see `.kiro/steerings/01-feature-flow.md` §2).
- **Never** touch the financial microservice's idempotency or audit
  requirements without flagging for the reinforced review in
  `.kiro/steerings/03-code-review.md`.

## Commit messages

Follow `docs/commit-conventions.md` exactly: subject line format, required
body for non-trivial changes, and one commit = one logical change.

## Financial code review

Any change touching `apps/payment-service/**` or financial entities in
`apps/api-core/**` requires **two approvers**, one of whom must be a
human developer (not the PR author). See
`.kiro/steerings/03-code-review.md` § Reinforced section.

## Off-limits (for everyone, human or agent)

- Committing directly to `main` without owner approval.
- Bypassing branch protection.
- Editing `.env` once populated (immutable — see
  `.kiro/steerings/00-project-context.md` § Environment variables).
- Changing business decisions in `00-project-context.md` without owner
  sign-off.

## Agent prompt templates

Standardized prompts to keep work synchronized and avoid collisions between
forks. Copy-paste these into your agent session. The sync step is mandatory
in all three collaborator prompts — it is the primary mechanism to detect
cross-fork overlaps before they become conflicts.

### 1. Start a new feature

```
Vamos a comenzar con la feature <nombre>. Antes de nada:
(1) Sincronizá contra upstream/main y reportame qué llegó desde la última
    vez y si algo se cruza con lo que vamos a hacer.
(2) Leé .kiro/steerings/00-project-context.md completo — esas decisiones
    de negocio no se reinterpretan.
(3) Leé .kiro/steerings/01-feature-flow.md para el formato de
    specs/design/tasks.
(4) Revisá docs/roadmap.md y docs/feature-status.md para ver el orden
    sugerido y si hay dependencias de otras features no mergeadas.
(5) Fijate en docs/feature-status.md si feature-scaffold-monorepo está
    completada — si no lo está, esa es la que hay que hacer primero.
    Nada funciona sin scaffolding.

Si algo de esto es ambiguo o depende de una decisión de negocio que no está
escrita, parás y preguntás — no asumís nada.

No crees la rama todavía: primero generá specs.md y esperá mi aprobación
antes de seguir con design.md.

Cuando cierres la tarea, actualizá docs/collaboration-log.md y pedime
confirmación antes de commitear.
```

### 2. Register a bug issue

```
Necesitamos registrar un issue sobre <problema observado>. Antes de nada:
(1) Sincronizá contra upstream/main y reportá qué cambió.
(2) Leé .kiro/steerings/02-issues-and-bugs.md y el specs.md de la feature
    afectada para comparar comportamiento esperado vs observado.

Armá el contenido del issue (severidad, pasos para reproducir, evidencia)
pero no crees el archivo todavía — mostrámelo primero para que yo confirme
severidad y que está bien planteado antes de que lo subas como PR.
```

### 3. Propose a feature from a user story

```
Quiero proponer una feature nueva a partir de esta historia de usuario:
<historia>.

(1) Sincronizá contra upstream/main y reportá cambios recientes.
(2) Leé .kiro/steerings/00-project-context.md completo.
(3) Si la historia deja algo de negocio sin definir (plazos, quién decide,
    qué pasa en el caso límite), no lo inventes — hacé una lista de
    preguntas abiertas antes de escribir specs.md.
```

### 4. Owner reviews a PR

For routine reviews, the trigger phrase is enough:

```
Review PR #42.
```

For sensitive changes (financial, cross-feature), add explicit criteria:

```
Review PR #42. Además del checklist estándar, chequeá:
(1) Si toca archivos que otra feature en progreso también está tocando
    (ver docs/feature-status.md).
(2) Si algo de lo que cambia ya tenía tests que pasaban y ahora los rompe.
(3) Si toca apps/payment-service o entidades financieras, aplicá la
    sección reforzada completa de 03-code-review.md.

Al final decime si está en condiciones de mergear, o qué bloquea — vos no
aprobás ni mergeas, decidís y me das el reporte.
```

### 5. Continue working on a collaborative feature

When you need to continue working on a feature where someone else already
merged their microtask:

```
Necesito continuar con la feature <nombre>. Antes de nada:
(1) Sincronizá contra upstream/<feature-branch> y reportame qué llegó
    desde la última vez y si algo se cruza con lo que voy a hacer.
(2) Leé el tasks.md de la feature para ver qué microtasks quedan pendientes
    y cuáles ya están completadas.
(3) Asigná la microtask que voy a ejecutar.

Si hay conflictos de merge o algo se cruza con lo que ya está hecho, parás
y preguntás — no asumís nada.
```

### Universal rule

The sync step — *"Sincronizá contra upstream/main y reportá qué cambió y
si se cruza con lo que vamos a hacer"* — must always come first. It is the
single checkpoint that prevents the 90% of fork collision risk.

## If in doubt, ask the owner

Do not assume. The owner has final say on all business logic, merge
decisions, and spec interpretation.
