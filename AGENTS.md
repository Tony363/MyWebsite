# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the entry point; shared fragments live under `partials/`.
- Client assets are in `assets/` (`css/`, `js/`, `images/`, `data/`). Keep vendor scripts in `assets/js/` and reference via `<script defer>`.
- Feature content (experience, projects) is data-driven from JSON under `assets/data/`.
- End-to-end automation resides in `tests/` with supporting reports in `playwright-report/` and `test-results/`.
- Utility scripts sit in `scripts/`; documentation such as performance guides is at the repo root.

## Build, Test, and Development Commands
- `npm install` – installs Playwright test dependencies. Re-run after updating `package.json`.
- `npx http-server . -p 8080` (or any static server) – serves the site locally for manual review and Playwright runs.
- `npm test` – executes the Playwright suite defined in `tests/contact-form-e2e.test.js`.
- `npm run test:headed` – opens the same suite with a visible browser for debugging.

## Coding Style & Naming Conventions
- Follow Prettier-style formatting: 2-space indentation for HTML/CSS/JS, 100-character guideline.
- Use descriptive, kebab-case filenames for assets (`assets/css/dark-mode.css`), PascalCase only for class-based components if introduced.
- Prefer modern ES modules, `const` by default, and avoid inline scripts; place logic in `assets/js/`.
- CSS variables (`--theme-*`) govern theming—extend tokens instead of hard-coding colors.

## Testing Guidelines
- Playwright is the canonical framework; add new journeys alongside `contact-form-e2e.test.js`.
- Name tests using the behavior under inspection (e.g., `test('Mobile layout hides timeline toggle', ...)`).
- Ensure the static server is running at `http://localhost:8080` before invoking `npm test`.
- Capture regressions with screenshots via Playwright’s `page.screenshot` helper when layout changes are validated.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat(theme): add neon dark mode toggle`); keep each commit focused on one change set.
- Reference specs or tasks in the body when available and summarise user-visible impact.
- PRs should include: purpose overview, testing evidence (`npm test` output or screenshots), and any configuration steps (e.g., EmailJS keys).
- Highlight accessibility/performance impacts and note if new assets require compression or CDN adjustments.


<!-- BEGIN IMPORTED-CLAUDE-MD -->

## Imported Claude Code Instructions

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static portfolio website for Tony Siu (AI Engineer). Built with vanilla HTML/CSS/JS - no build step required. Features particle.js animations, data-driven content from JSON, and comprehensive Playwright E2E testing.

**Live site**: https://tonysiu.dev

## Commands

```bash
# Install dependencies (Playwright only)
npm install

# Start local server (required for testing)
python -m http.server 8080
# Or: npx serve . -p 8080

# Run all tests (headless)
npm test

# Run tests with visible browser
npm run test:headed

# Run interactive test UI
npm run test:ui

# Run contact form tests only
npm run test:contact
```

## Architecture

### Data-Driven Content
- `assets/data/experience.json` - Work experience timeline
- `projects/projects.json` - Project portfolio with category filtering
- `skills.json` - Technical skills (50+ technologies)

### Key JavaScript Files
- `assets/js/script.js` - Theme management (light/dark), core functionality
- `assets/js/app.js` - Particle.js configuration
- `assets/js/animations.js` - Scroll-triggered animations
- `assets/js/skills-interactive.js` - Skills section interactions
- `assets/js/projects-interactive.js` - Project filtering

### CSS Architecture
- Root variables in `assets/css/style.css` define `--earth-*` color palette
- Theme toggle via `data-theme` attribute on `<html>`
- Modular stylesheets: `animations.css`, `form-enhancements.css`, `accessibility.css`, `apple-theme.css`

### Testing (Playwright)
- Config: `playwright.config.js` (5 browser profiles: Desktop Chrome/Firefox/Safari, Mobile Chrome/Safari)
- Base URL: `http://localhost:8080`
- Tests in `tests/` - contact form, UI interactions, accessibility, visual regression

## Code Style

- 2-space indentation (HTML, CSS, JS)
- kebab-case for filenames and CSS classes
- camelCase for JavaScript variables
- CSS variables for colors (`--theme-*`, `--earth-*`) - no hardcoded colors
- ES6+ with `const` by default
- All scripts use `defer` attribute

## Key Patterns

- Theme preference persists to localStorage
- Respects `prefers-color-scheme` system setting
- Accessibility: skip navigation, ARIA labels, keyboard navigation, WCAG AA compliant
- Performance: DNS prefetch for CDNs, lazy loading images, `will-change` on animated elements

## Updating Content

- Experience: Edit `assets/data/experience.json`
- Projects: Edit `projects/projects.json`
- Skills: Edit `skills.json`
- Styles: Extend CSS variables in `:root` rather than hardcoding colors

<!-- END IMPORTED-CLAUDE-MD -->

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **MyWebsite** (590 symbols, 1381 relationships, 45 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/MyWebsite/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/MyWebsite/context` | Codebase overview, check index freshness |
| `gitnexus://repo/MyWebsite/clusters` | All functional areas |
| `gitnexus://repo/MyWebsite/processes` | All execution flows |
| `gitnexus://repo/MyWebsite/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
