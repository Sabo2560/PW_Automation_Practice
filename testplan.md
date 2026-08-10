# Test Plan – Automation Playground (automationplayground.dev)

## 1. Objective
Validate core UI functionality, component behavior, and API interactions of automationplayground.dev using Playwright.

## 2. Scope
- Pages: Home, Components, FAQ
- All 16 components under `/components/*`
- API calls triggered by components (data fetch/submit)

## 3. Out of Scope
- Payment/donation flow (Buy Me a Coffee — external, 3rd party)
- Email client behavior (mailto link)

## 4. Test Environment
- Browser: Chromium, Firefox, WebKit (via Playwright projects)
- Base URL: https://www.automationplayground.dev/
- Framework: Playwright Test (TS)

## 5. Pre-requisite: Identify API routes
No public API docs exist. Before writing API tests:
1. Open each component page with DevTools → Network tab open.
2. Interact with the component (submit form, load table, upload file).
3. Record actual XHR/fetch endpoints, methods, and payloads.
4. Alternatively, use Playwright's `page.on('request')` / `page.route()` in a throwaway script against each page to log calls automatically.

Update this doc's API section once endpoints are confirmed.

## 6. Core Functional Test Areas

### 6.1 Home Page
- Page loads, title/meta correct
- Nav links present: Home, Components, F.A.Q
- "Browse all components" CTA navigates to /components
- "Get started" CTA navigates to /components
- Contact email link (mailto) has correct address
- Buy Me a Coffee link opens correct external URL

### 6.2 Components listing page (/components)
- All 16 component cards render (name + description + link)
- Difficulty/Type filters (if functional) filter the list correctly
- Each card link navigates to correct component page

### 6.3 Component pages (one suite per component)
| Component | Key test cases |
|---|---|
| Input | Type text, clear, validation (required/format), max length, disabled state |
| Button | Click, disabled state, loading state, double-click prevention |
| Dropdown | Open/close, select option, keyboard navigation, default value |
| Multiselect | Select multiple, deselect, select all/none, search/filter if present |
| Alert | Trigger alert, verify message/type (success/error/warning), dismiss |
| Radio | Select option, checkbox toggle, group exclusivity, default state |
| Drag | Drag element to target, verify final position/state |
| Wait | Trigger action, assert alert appears within expected async delay |
| Simple Table | Row count, column headers, sorting (if present), cell content |
| Advanced Table | Sorting, filtering, pagination, row selection, search |
| Form | Fill all fields, submit valid data, submit invalid data (validation errors), reset |
| Calendar | Pick date, navigate months/years, disabled dates, range selection if present |
| Slider | Drag to value, keyboard arrow adjustment, min/max bounds |
| Upload File | Upload valid file, upload invalid type/size, remove uploaded file |
| Drag and Drop | Move item between zones, cancel drop outside target, multiple items |
| Window | Trigger new window/tab, verify content, verify original window state |

### 6.4 FAQ Page
- Page loads
- FAQ items expand/collapse (accordion) if present
- Content matches expected copy

## 7. API Test Components (to finalize after Step 5)
For each component with backend interaction (likely: Form, Advanced Table, Upload File):
- Verify request method, URL, headers, payload shape
- Verify response status code and body schema
- Verify UI reflects API response (success/error states)
- Negative cases: malformed payload, server error simulation via `page.route()` mocking

## 8. Cross-cutting / Non-functional
- Responsive layout: mobile, tablet, desktop viewports
- Basic accessibility: labels present, keyboard-only navigation on key components
- Cross-browser run: Chromium, Firefox, WebKit

## 9. Test Data & Conventions
- Use `test.describe()` per component
- Shared fixtures for navigation/setup in `fixtures/`
- Selectors: prefer `data-testid`, fallback to role/text locators
- Naming: `component-name.spec.ts` under `tests/`

## 10. CI/CD
- All specs run on push/PR via existing GitHub Actions workflow (`.github/workflows/playwright.yml`)