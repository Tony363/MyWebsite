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
