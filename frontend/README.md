# Frontend: React User Interface

This is the frontend client for SocialSphere. It is a highly responsive, single-page web application built with React, React Router v7, and custom CSS themes. 

## Core Architecture & Features

### 1. Separation of Logic (Custom Hooks)
To keep the visual components clean and easy to read, all complex business logic and API requests are extracted into reusable custom hooks:
* `useRelationship`: Handles follow requests, accepting requests, and unfollowing. It includes built-in loading states to prevent double-clicks.
* `usePostInteraction` & `useCommentInteraction`: Manage likes, comments, and real-time counter updates across the application.

### 2. Smart API Request Wrapper (`customFetch`)
Our custom fetch utility automates authentication and protects the application from common network crashes:
* **Handles Empty Responses:** Safely processes HTTP `204 No Content` and `205 Reset Content` responses without throwing syntax errors.
* **Auto-Logout Security:** Catches `401 Unauthorized` errors (like an expired session), clears local login tokens, and securely redirects the user to the login screen without causing infinite page-reload loops.

### 3. Flexible Layout Headings (`headingLevel`)
To keep our HTML structured properly for accessibility, components use a dynamic heading property. Instead of hardcoding an `<h2>` or `<h3>`, components accept a `headingLevel` prop (e.g., `headingLevel="h3"`). This ensures heading tags remain sequential whether a component is used on the main dashboard or inside a small profile card.

### 4. Clean Popups & Modals (React Portals)
Modals like `<ImageModal />` use React Portals (`createPortal`) to render directly into the HTML `<body>` tag. This keeps modal windows physically separate from their parent layout elements, preventing background CSS styles, animations, or layout constraints from accidentally cutting off or misaligning the popup overlays.

### 5. Accessibility (a11y)
Built from the ground up to support assistive technologies like screen readers:
* **Form Labels:** Every input and textarea is explicitly connected to a native `<label>` tag using matching `id` and `htmlFor` attributes.
* **Hidden Labels:** Labels that are hidden visually for design reasons use a `.visuallyHidden` CSS class, ensuring screen readers can still read them.
* **Keyboard Navigation:** Redundant links (like clicking a profile picture vs. clicking a profile name) are grouped into a single focusable element, cutting keyboard tab-navigation time in half.
* **Clear Landmarks:** Each page layout ensures exactly one `<main>` HTML tag exists per view.

### 6. Themes & Color Contrast
The app includes six unique visual themea controlled entirely via CSS variables and HTML `data-` attributes. All color palettes are optimized to guarantee clear readability, meeting or exceeding standard accessibility contrast ratios (4.5:1).

## 🧪 Testing & Building the App

We use **Vitest** and **React Testing Library** alongside **Mock Service Worker (MSW)**. MSW intercepts our network requests and feeds mock data to our components, allowing us to test our frontend exactly how it behaves in production.

### Run the Test Suite
Launch the interactive test runner to check component functionality:
```bash
npm run test
```

### Build and Preview for Production
To create an optimized production build and preview it locally (this also generates a visual file-size report at `dist/stats.html`):
```bash
npm run build
npm run preview
```
