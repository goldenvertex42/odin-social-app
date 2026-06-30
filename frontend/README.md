# Frontend Architecture: High-Performance Single-Page React Application

The SocialSphere frontend is a highly responsive, enterprise-ready client user interface engineered using modern React Router v7 paradigms, decoupled UI state context providers, themeable component sheets, and declarative custom hooks.

## Technical Architecture Highlights

### 1. Custom Hook Business Logic Isolation (DRY Design)
The client application completely separates visual layout rendering from imperative business logic and network mutation lifecycles. By engineering reusable, encapsulated custom state machines, component view files remain completely thin and declarative:
* `useRelationship`: Universal social graph mutation engine handling `POST` (follow), `PATCH` (accept), and `DELETE` (cancel/unfollow) REST operations with built-in processing lockouts across profile screens and discovery grids.
* `usePostInteraction` / `useCommentInteraction`: Isolated interaction hooks that natively manage numerical engagement counters and evaluate session arrays to calculate user liking states dynamically.

### 2. Anti-Loop Network Interceptor Layer
The core custom `customFetch` interceptor engine automates token injection and eliminates unhandled rendering crashes. 
* **Spec Compliance:** Natively intercepts HTTP `204 No Content` and `205 Reset Content` server codes, generating a safe `Response` structure using explicit `null` body streams to comply with native Fetch API guidelines and prevent browser engine crashes.
* **Redirection Protection:** Catches `401 Unauthorized` token expiration triggers, purges invalid session parameters, and invokes non-cyclic `window.location.replace` history transitions to completely cut off recursive network request loops at the perimeter.

### 3. Dynamic Heading Pattern
To maintain a valid, strict sequential heading outline across fluid layouts, component headers utilize a dynamic heading wrapper pattern. Instead of hardcoding layout elements, components accept a `headingLevel` parameter property (e.g., `"h2"`, `"h3"`), mapping the string parameter directly to a capitalized element reference variable (`const Heading = headingLevel;`). This guarantees compliance regardless of whether a card component is mounted inside a primary feed container or nested inside a profile timeline section.

### 4. React Portals Stacking Context Isolation
Overlay windows and dialog trees like `<ImageModal />` utilize React Portals (`createPortal`) to physically detach their HTML nodes from their rendering parents and mount them directly to `document.body`. This breaks through any parent CSS stacking context layout traps caused by `transform`, `filter`, or `will-change` animations, ensuring `position: fixed` overlays cover 100% of the screen viewport across all feeds.

### 5. Semantic Native HTML Accessibility (WCAG AA Compliance)
The application adheres strictly to the First Rule of ARIA by preferring native HTML semantics over artificial attributes wherever possible:
* **Programmatic Association:** Inputs and textareas utilize explicit native `<label>` tags with matching `htmlFor` and `id` properties to guarantee screen-reader (VoiceOver, NVDA) traversal.
* **Visual Clipping:** Hidden fields utilize an off-screen clipping utility class (`.visuallyHidden`) to retain clear semantic labeling for screen readers while preserving a clean user experience.
* **Link Consolidation:** Combined redundant, double-tab profile link targets (such as individual avatar and name links) into single, semantic keyboard-focusable blocks, reducing tab-navigation overhead by 50%.
* **Landmark Purity:** Restructured layout outlines to ensure exactly one primary `<main>` landmark exists per route.

### 6. Fluid CSS Tokenization and Contrast Management
The interface features six unique design configurations driven entirely by CSS Custom Properties tied to `data-` HTML attributes, including a high-contrast Cyberpunk Dark theme. All active hover text states are mathematically optimized against background variables using sRGB relative luminance checks to ensure they maintain a contrast ratio exceeding the WCAG 4.5:1 AA minimum threshold (achieving up to a 11.23:1 ratio on core panels).

## 🧪 Comprehensive Mock Service Worker (MSW) Testing Framework

Client features are tested using **Vitest** and **React Testing Library**. By using global Mock Service Worker (MSW) server configurations, the test suites target genuine, un-mocked application contexts and `customFetch` modules. The components make real asynchronous requests against an isolated network sandbox (`handlers.js`), verifying true integration parity.

To run the frontend testing and assertion registry suite:
```bash
npm run test
```

To run a local production build pass to audit minified manual asset chunk splits (`rollup-plugin-visualizer` maps will generate under `dist/stats.html`):
```bash
npm run build
npm run preview
```
