# Frontend Architecture: High-Performance Single-Page React Application

The SocialSphere frontend is a highly responsive client user interface engineered using modern React Router v7 paradigms, decoupled UI state context providers, and themeable component style sheets.

## Technical Architecture Highlights

### 1. Anti-Loop Network Interceptor Layer
The custom `customFetch` client engine eliminates unhandled rendering crashes by returning structured response contracts instead of throwing unexpected exceptions. If the API returns a 401 Unauthorized code, the interceptor immediately clears invalid session tokens from local storage and safely moves the viewport back to the login path, cutting off infinite recursive request loops at the perimeter.

### 2. Single Responsibility UI Decomposition
The application rejects large monolithic layout structures. Complex views, such as the account dashboard, are split into isolated, focused child sub-components:
* `AvatarUpload`: Tracks `FileReader` calculation buffers and local image previews.
* `ThemePreview`: Repaints custom color properties onto document roots without triggering global state leaks.
* `PasswordUpdate`: Collects data values and verifies matching string constraints independently.

### 3. Fluid CSS Tokenization and Accessibility (a11y)
The app features six design configurations driven entirely by CSS Custom Properties tied to `data-` HTML tags. Every palette uses carefully calculated color combinations to pass WCAG AA contrast guidelines (minimum 4.5:1 ratio). Interactive controls also include explicit, non-blurry `:focus-visible` keyboard rings to ensure perfect accessibility mapping for screen readers and keyboard operators.

### 4. Vector Icon Standardization
SocialSphere uses vector paths from `lucide-react` instead of raw browser emojis. This ensures icons render with exact pixel proportions and uniform color states across all desktop browers, iOS viewports, and Android screens alike.

## Continuous Integration Testing Framework

Client interactions are verified using Vitest and React Testing Library. The testing framework uses explicit mock spies to ensure that real-time visual adjustments change form dropdown inputs correctly without conflicting with active document roots.

To run the frontend testing engine:
```bash
npm run test
```
