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
