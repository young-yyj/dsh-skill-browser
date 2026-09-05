# DSH Home Skills Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace session-registry skill data with a read-only catalog of `<DSH_HOME>/skills/*/SKILL.md`.

**Architecture:** A filesystem catalog service resolves its root with `dshHomePath('skills')`, maintains a validated name-to-realpath index, and supplies list/detail data to existing routes. A watcher invalidates the catalog when the root or direct skill folders change. Session IDs remain request authorization only.

**Tech Stack:** TypeScript, Node `fs/promises`, Node `fs.watch`, Vitest, DSH Home Paths.

**Spec:** `docs/superpowers/specs/2026-09-04-dsh-home-skills-catalog-design.md`

## Global Constraints

- Use `dshHomePath('skills')`; never hardcode a username or home directory.
- Only accept direct `<root>/<skill-name>/SKILL.md` files after realpath containment checks.
- Never fall back to session registries or arbitrary request paths.
- Bound catalog fields and content with existing contracts.

---

### Task 1: Filesystem catalog service

**Files:**
- Create: `src/host/dsh-home-skill-catalog.ts`
- Create: `tests/dsh-home-skill-catalog.spec.ts`

**Interfaces:**
- Produces `DshHomeSkillCatalog.list(): Promise<CatalogResponse>` and `detail(name: string): Promise<SkillDetailResponse>`.

- [ ] Write failing tests using a temporary root with valid skills, missing `SKILL.md`, an invalid name, oversized content, and a symlink escaping the root.
- [ ] Run `npm test -- dsh-home-skill-catalog.spec.ts`; expect failure because the module does not exist.
- [ ] Implement root resolution, direct-directory enumeration, realpath containment, bounded text reads, frontmatter description extraction, and an in-memory validated index.
- [ ] Re-run the focused test; expect all cases to pass.

### Task 2: Replace session-registry integration and add invalidation

**Files:**
- Modify: `src/index.ts`
- Modify: `src/host/catalog-service.ts`
- Delete: `src/host/session-skill-view.ts`
- Modify: `tests/catalog-service.spec.ts`
- Modify: `tests/host-lifecycle.spec.ts`

**Interfaces:**
- Consumes `DshHomeSkillCatalog`; routes retain `list(sessionId)` and `detail(sessionId, name)` signatures.

- [ ] Write failing lifecycle tests proving `sessionId` is validated without reading a session skill registry, and filesystem invalidation increments the revision.
- [ ] Run the two focused test files; expect registry-dependent assertions to fail.
- [ ] Remove `agents`, `sessionQuery`, and `skills` injection; use the new catalog; watch the resolved root and publish debounced invalidations.
- [ ] Re-run focused tests; expect pass, and verify detail never accepts an arbitrary path.

### Task 3: Align user-facing copy, documentation, and full verification

**Files:**
- Modify: `src/client/locales.ts`
- Modify: `README.md`
- Modify: `tests/client-presentation.spec.ts`

- [ ] Write failing locale/presentation assertions for “DSH Home 技能目录” and remove session/cwd wording.
- [ ] Update Chinese and English strings plus README feature description to state the only source is DSH Home `skills`.
- [ ] Run `npm run verify && npm pack --dry-run`; expect all existing and new tests, type checking, build, and package preflight to pass.
- [ ] Commit the code, tests, docs, and this plan with a Chinese title and multi-line summary.
