# Test Plan – Automation Playground (automationplayground.dev)

## 1. Objective

Validate core UI functionality, component behavior, and API interactions of automationplayground.dev using Playwright.

## 2. Scope

- Pages: Home (implemented below), Components, FAQ
- All 16 components under `/components/*`
- API calls triggered by components (data fetch/submit)

## 3. Test Environment

- Browser: Chromium, Firefox, WebKit (via Playwright projects)
- Base URL: `https://www.automationplayground.dev/`
- Framework: Playwright Test (TS)

## 4. Conventions

- Use `test.describe()` per suite, matching the section titles below
- One `test-file` per suite; one `test()` per scenario
- Seed reference: `tests/seed.spec.ts` (baseline patterns for new specs)
- Naming: `<area>-<topic>.spec.ts` under `tests/<area>/`

## 5. CI/CD

All specs run on push/PR via the existing GitHub Actions workflow (`.github/workflows/`).

---

## 6. Home Page — Implemented

**Status:** Implemented. 14 scenarios, 4 spec files, all passing across chromium/firefox/webkit.

**Application Overview:** Automation Playground is a demo/practice site for automation testing learners. The home page ("/") is a mostly static marketing/landing page consisting of: a header with branding link and primary navigation (Home, Components, F.A.Q — collapsed behind a hamburger menu on mobile viewports), a hero section with a heading, tagline, "Browse all components" CTA, and a "Scroll down" anchor link (#learn-more); an "Automation newbie?" section with a "Get started" CTA linking to /components; a "Got a feature in Mind?" informational section; a "Like the project?" section containing a mailto contact link and an external "Buy Me A Coffee" link (opens in a new tab); and a footer with copyright text.

**Seed:** `tests/seed.spec.ts`

### 6.1. Home Page - Load and Branding

**File:** `tests/home/home-load.spec.ts`

#### 6.1.1. Home page loads with correct title, heading, and branding

**Steps:**
  1. Navigate to the base URL '/'
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Page title is 'Automation playground'
    - expect: Header logo/heading link 'Automation Playground' is visible in the banner and links to '/'
  2. Verify the hero section is visible
    - expect: Hero heading 'The Library of Components for Automation Testing' (level 1) is visible
    - expect: Hero subtitle paragraph 'Sharpen Your Automation Skills Through Real Examples' is visible
    - expect: 'Browse all components' call-to-action link is visible
  3. Verify the footer is visible at the bottom of the page
    - expect: Footer contains copyright text '© 2026 Automation Playground.' and 'All rights reserved.'

#### 6.1.2. Header navigation links are present and correctly targeted

**Steps:**
  1. Navigate to '/' and locate the header navigation region
    - expect: Navigation contains exactly three links: 'Home', 'Components', 'F.A.Q'
  2. Inspect the href attributes of the 'Home', 'Components', and 'F.A.Q' links without clicking
    - expect: 'Home' link href resolves to '/'
    - expect: 'Components' link href resolves to '/components'
    - expect: 'F.A.Q' link href resolves to '/faq'

### 6.2. Home Page - Navigation Journeys

**File:** `tests/home/home-navigation.spec.ts`

#### 6.2.1. Clicking the logo/branding link navigates to (or stays on) the home page

**Steps:**
  1. Navigate to '/components' first (to ensure not already on home), then click the 'Automation Playground' branding link in the header
    - expect: Browser navigates to '/' (baseURL root)
    - expect: Hero heading 'The Library of Components for Automation Testing' is visible confirming home page loaded

#### 6.2.2. Clicking header 'Components' nav link navigates to Components page

**Steps:**
  1. Navigate to '/' and click the 'Components' link in the header navigation
    - expect: URL changes to '/components'
    - expect: Components page loads without error (basic landmark such as a heading or main content is visible)

#### 6.2.3. Clicking header 'F.A.Q' nav link navigates to FAQ page

**Steps:**
  1. Navigate to '/' and click the 'F.A.Q' link in the header navigation
    - expect: URL changes to '/faq'
    - expect: FAQ page loads without error (basic landmark such as a heading or main content is visible)

#### 6.2.4. Clicking header 'Home' nav link while already on home page keeps user on home page

**Steps:**
  1. Navigate to '/' and click the 'Home' link in the header navigation
    - expect: URL remains '/' (or resolves to baseURL root)
    - expect: Hero section content is still visible, page did not error or blank out

#### 6.2.5. 'Browse all components' hero CTA navigates to Components page

**Steps:**
  1. Navigate to '/' and click the 'Browse all components' link in the hero section
    - expect: URL changes to '/components'
    - expect: Destination page loads successfully with visible content

#### 6.2.6. 'Get started' CTA in 'Automation newbie?' section navigates to Components page

**Steps:**
  1. Navigate to '/' and scroll to the 'Automation newbie?' section, then click the 'Get started' link
    - expect: URL changes to '/components'
    - expect: Destination page loads successfully with visible content

#### 6.2.7. 'Scroll down' hero anchor scrolls to the 'learn-more' section on the same page

**Steps:**
  1. Navigate to '/' and click the 'Scroll down' link in the hero section
    - expect: URL updates to include the fragment '#learn-more'
    - expect: Page does not navigate away (stays on '/'), and the viewport scrolls so the section following the hero (e.g. 'Automation newbie?' heading) becomes visible/in view
    - expect: No full page reload occurs (in-page anchor navigation only)

### 6.3. Home Page - Content Sections and External Links

**File:** `tests/home/home-content.spec.ts`

#### 6.3.1. 'Automation newbie?' section displays expected copy and illustration

**Steps:**
  1. Navigate to '/' and scroll to the 'Automation newbie?' section
    - expect: Heading 'Automation newbie?' (level 2) is visible
    - expect: Descriptive paragraph mentioning 'Automation Playground is a testing space for new automation engineers...' is visible
    - expect: 'Automation Testing Illustration' image is visible and has a non-empty alt attribute
    - expect: 'Get started' link is visible within this section

#### 6.3.2. 'Got a feature in Mind?' section displays expected copy

**Steps:**
  1. Navigate to '/' and scroll to the 'Got a feature in Mind?' section
    - expect: Heading 'Got a feature in Mind?' (level 2) is visible
    - expect: Paragraph text 'Drop us a message — we're always open to improvements and experiments!' is visible
    - expect: Associated illustration image is visible

#### 6.3.3. 'Like the project?' section: mailto contact link has correct address

**Steps:**
  1. Navigate to '/' and scroll to the 'Like the project?' section, then inspect the contact link's href attribute (do not click, to avoid launching a mail client)
    - expect: Heading 'Like the project?' (level 2) is visible with paragraph 'Feedback or coffee — both help us build better, faster!'
    - expect: Contact link text is 'qa.automation.playground@gmail.com'
    - expect: Link href equals 'mailto:qa.automation.playground@gmail.com' exactly (correct address, no typos)

#### 6.3.4. 'Buy Me A Coffee' external link opens correct destination in a new tab

**Steps:**
  1. Navigate to '/', scroll to the 'Like the project?' section, and verify the 'Buy Me A Coffee' image link's href and target attributes before interacting
    - expect: Link href equals 'https://www.buymeacoffee.com/automationplayground'
    - expect: Link target attribute equals '_blank' (opens in a new tab)
  2. Click the 'Buy Me A Coffee' link and capture the newly opened page/tab
    - expect: A new browser tab/page opens
    - expect: The new tab's URL starts with 'https://www.buymeacoffee.com/automationplayground'
    - expect: The original home page tab remains open and unchanged at '/'

#### 6.3.5. No broken links: all home page links respond successfully

**Steps:**
  1. Navigate to '/' and collect all anchor tag hrefs on the page (internal: '/', '/components', '/faq', '#learn-more'; external: buymeacoffee.com; mailto is excluded from HTTP checks)
    - expect: Each internal link, when requested, returns a successful response (status < 400) and renders a non-error page
    - expect: The external 'buymeacoffee.com' link, when requested via API/HEAD request, returns a successful or redirect response (status < 400)
    - expect: No link href is empty, '#', or javascript:void(0)

### 6.4. Home Page - Responsive and Accessibility Checks

**File:** `tests/home/home-responsive.spec.ts`

#### 6.4.1. Home page renders correctly on mobile viewport

**Steps:**
  1. Set viewport to a mobile size (e.g. 375x812) and navigate to '/'
    - expect: Header, hero heading, and CTA buttons remain visible and are not overlapping or clipped
    - expect: Navigation is accessible via the mobile hamburger menu button; opening it reveals Home/Components/F.A.Q links
    - expect: Footer remains visible and readable at the bottom of the page

#### 6.4.2. Home page renders correctly on tablet and desktop viewports

**Steps:**
  1. Set viewport to tablet size (e.g. 768x1024) and navigate to '/'; then repeat with a desktop size (e.g. 1440x900)
    - expect: At each viewport size, the hero section, content sections, and footer are visible without horizontal scrollbars or overlapping elements
    - expect: All key CTAs ('Browse all components', 'Get started') remain clickable and correctly positioned

#### 6.4.3. Key images on the home page have accessible alt text

**Steps:**
  1. Navigate to '/' and inspect all `<img>` elements rendered on the page
    - expect: The 'Automation Testing Illustration' images have non-empty, descriptive alt attributes
    - expect: The 'Buy Me A Coffee' image has a non-empty alt attribute
    - expect: No image is missing an alt attribute entirely (decorative images use alt="" intentionally, content images have descriptive alt text)

#### 6.4.4. Home page heading hierarchy is valid

**Steps:**
  1. Navigate to '/' and inspect the document heading structure
    - expect: There is exactly one level-1 heading region for branding ('Automation Playground' in the banner) and one level-1 heading for the hero ('The Library of Components for Automation Testing'), or headings otherwise follow a logical, non-skipping hierarchy
    - expect: Section headings ('Automation newbie?', 'Got a feature in Mind?', 'Like the project?') are level-2 headings

---

## 7. Components Listing Page (`/components`) — Not Yet Planned

- All 16 component cards render (name + description + link)
- Difficulty/Type filters (if functional) filter the list correctly
- Each card link navigates to correct component page

## 8. Component Pages — Not Yet Planned

One suite per component, once individually planned:

| Component | Key test cases |
|---|---|
| Dropdown | Open/close, select option, keyboard navigation, default value |
| Multiselect | Select multiple, deselect, select all/none, search/filter if present |
| Radio | Select option, checkbox toggle, group exclusivity, default state |
| Wait | Trigger action, assert alert appears within expected async delay |
| Simple Table | Row count, column headers, sorting (if present), cell content |
| Calendar | Pick date, navigate months/years, disabled dates, range selection if present |
| Slider | Drag to value, keyboard arrow adjustment, min/max bounds |
| Upload File | Upload valid file, upload invalid type/size, remove uploaded file |
| Drag and Drop | Move item between zones, cancel drop outside target, multiple items |
| Window | Trigger new window/tab, verify content, verify original window state |

Fully planned separately (see linked docs): Advanced Table (`specs/advanced-table.plan.md`), Form (`specs/form.plan.md`), Input (`specs/input.plan.md`), Button (`specs/button.plan.md`), Alert (`specs/alert.plan.md`), Drag (`specs/drag.plan.md`).

## 9. Alert Component (`/components/alert`) — Implemented

**Status:** Fully implemented (`tests/components/alert/`, 13 scenarios, all passing across chromium/firefox/webkit). The component presents four independent dialog-trigger buttons (native `alert()`, `confirm()`, `prompt()`, and a custom SweetAlert2 modal), all purely client-side with no backing API calls.

Fully planned separately (see linked doc): Alert (`specs/alert.plan.md`).

## 10. FAQ Page — Not Yet Planned

- Page loads
- FAQ items expand/collapse (accordion) if present
- Content matches expected copy

## 11. API Testing — Not Yet Planned

No public API docs exist. Before writing API tests:
1. Open each component page with DevTools → Network tab open.
2. Interact with the component (submit form, load table, upload file).
3. Record actual XHR/fetch endpoints, methods, and payloads.
4. Alternatively, use Playwright's `page.on('request')` / `page.route()` in a throwaway script against each page to log calls automatically.
5. Update this doc's API section once endpoints are confirmed.

For each component with backend interaction (likely: Form, Advanced Table, Upload File):
- Verify request method, URL, headers, payload shape
- Verify response status code and body schema
- Verify UI reflects API response (success/error states)
- Negative cases: malformed payload, server error simulation via `page.route()` mocking

## 12. Out of Scope

- Payment/donation flow completion on Buy Me a Coffee (external, 3rd-party — home page only verifies the outbound link target, not the checkout flow)
- Email client behavior (mailto link — home page only verifies the href, does not send mail)
