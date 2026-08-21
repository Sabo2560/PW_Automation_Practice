# PW Automation Practice

Playwright end-to-end test suite for [automationplayground.dev](https://www.automationplayground.dev/).

[![Playwright Tests](https://github.com/Sabo2560/PW_Automation_Practice/actions/workflows/playwright.yml/badge.svg)](https://github.com/Sabo2560/PW_Automation_Practice/actions/workflows/playwright.yml)

## Setup

```
npm install
npx playwright install
```

## Run tests

```
npm test
```

(equivalent to `npx playwright test` — either works)

Run a single component's suite:
```
npm test -- tests/components/multiselect/
```

Run a single spec file:
```
npm test -- tests/components/dropdown/dropdown-load.spec.ts
```

Run against one browser only:
```
npm test -- --project=chromium
```

View the HTML report after a run (screenshots/traces for any failures):
```
npx playwright show-report
```

## Project structure

```
tests/
  components/           # one directory per component (Input, Button, Dropdown, Multiselect, ...),
                         # each with several spec files split by concern (load, selection, keyboard, ...)
  pages/                 # Page Object Model — one class per component (extends BasePage.ts),
                         # exposing locators/helpers so spec files don't scatter raw page.locator() calls
  home/                  # home page coverage (branding, navigation, responsive, a11y)
  componentsnavigation.spec.ts   # cross-page: walks every component card and back
  seed.spec.ts

scripts/
  discover-api.js       # standalone script to detect any real backend API calls per page

specs/
  test-plan.md           # scope, coverage, and known findings (see below)
  <component>.plan.md    # per-component test plan (Application Overview, data-testid inventory,
                          # confirmed behaviors, known bugs/quirks, numbered test scenarios)

.claude/agents/          # Playwright test agents (planner, generator, healer) — see Agents section
```

## Test plan and known findings

See [specs/test-plan.md](./specs/test-plan.md) for full scope, coverage breakdown, and test design notes.

The plan also tracks bugs/inconsistencies found on the site during testing (not test bugs — actual site issues),
including:
- Advanced Table: changing page size while on an out-of-range page produces an invalid state (`page X / Y` where
  X > Y, and a nonsensical entries range)
- Alert component card description incorrectly says "buttons" instead of "alerts"
- Radio component card's CTA button is labeled "Toggle" instead of matching its actual name
- Home page has two `<h1>` elements (branding + hero heading), which isn't valid heading hierarchy
- Multiselect: `#search_input` and `#multiselectContainerReact` are non-unique HTML ids repeated identically
  across all three widget instances on the same page (invalid HTML — confirmed via `querySelectorAll` returning
  3 elements for each id)
- Radio: `id="Yes"` and `id="No"` are each used twice document-wide (once in the "answer-radio" group, once in
  "one-radio") — a duplicate-id defect that also breaks accessible names for both groups

## CI/CD

Tests run automatically via GitHub Actions (`.github/workflows/playwright.yml`) on:
- Every push to `main`
- Every pull request against `main`
- A daily scheduled run (06:00 UTC)
- Manual trigger via the Actions tab ("Run workflow")

HTML reports are uploaded as build artifacts and retained for 30 days.

## Playwright Test Agents

This project also uses Playwright's built-in AI agents (Planner, Generator, Healer) via Claude Code, configured
under `.claude/agents/`. These agents:
- **Planner** — explores a live page and writes a structured test plan with prioritized, specific scenarios
- **Generator** — turns a plan into executable Playwright specs, grounded against the real running app
- **Healer** — diagnoses failing tests, distinguishing real app regressions from test bugs, and fixes or flags
  accordingly

The agent definitions in this repo have been customized beyond Playwright's defaults (stricter assertion-quality
rules, ISTQB-style test design guidance, regression-vs-test-bug classification for the healer). Regenerate with
`npx playwright init-agents --loop=claude` only if you want to reset to Playwright's stock prompts — otherwise
edit the files in `.claude/agents/` directly.