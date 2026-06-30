# SocialSphere Enterprise Monorepo Application Architecture

A full-stack, decoupled social media web application engineered with a focus on type-safe relational models, dynamic design tokens, accessible theme engines, and high-performance asynchronous runtime architectures validated by automated test runner cycles.

## Architectural Overview

SocialSphere is structured as a modular, feature-based monorepo, cleanly separating the user-facing single-page application from the database modeling layer and the stateless REST API. The platform enforces absolute isolation of concerns, utilizing JSON Web Tokens (JWT) for secure authentication transitions, custom fetch interceptors to block recursive network render loops, and integrated transactional media cloud cascade cleanup pipelines.

## 📂 Monorepo Project Structure

```text
├── db/                         # Relational Database Modeling Directory
│   ├── prisma/                 # PostgreSQL Schema Definitions and Seeding Scripts
│   └── src/                    # Centralized Prisma Client Instantiation Node
├── backend/                    # Stateless REST API Express Engine
│   ├── src/
│   │   ├── config/             # Passport OAuth and Cloudinary Middleware Configurations
│   │   ├── middleware/         # Binary Upload Streams and Authentication Guards
│   │   ├── routes/             # Feature Controllers, Integration Routes, and Test Coverage
│   │   └── utils/              # Cryptographic Tokens and Cloud Strata Helpers
│   └── tests/                  # Jest & Supertest API Test Setup
└── frontend/                   # High-Performance Single Page React Client
    ├── src/
    │   ├── components/         # Atomic UI Modules organized by Feature Folders
    │   │   ├── auth/           # Auth Forms (e.g., LoginForm, RegisterForm, AuthSuccess)
            ├── layout/         # Application Shell Containers (e.g., Header, Sidebar, ProtectedRoute)
            ├── network/        # Networking Component For UserIndex (e.g., FollowCard)
            ├── profile/        # Isolated Settings Modules (e.g., AvatarUpload, ThemePreview, PasswordUpdate)
    │   │   ├── social/         # Granular Sub-components (e.g., PostHeader, PostActions)
            └── ui/             # Shareable Portal Element (e.g., ImageModal)
    │   ├── context/            # Auth and Theme Global State Context Providers
    │   ├── hooks/              # Isolated useRelationship & usePostInteraction State Machines
    │   ├── styles/             # Centralized Fluid Tokenization Layout Themes
    │   ├── utils/              # Spec-Compliant Network Interceptor Modules
    │   └── views/              # Decoupled Route Orchestrator Canvas Components
    └── tests/                  # Unified Vitest & React Testing Library Integration Specs
```

## 🛠️ System Features

### 1. Bidirectional Relationship Engine & Custom Hooks
Implements a strict, four-part relational state machine (`NOT_FOLLOWING`, `REQUEST_SENT`, `REQUEST_RECEIVED`, `FOLLOWING`) utilizing atomic database upserts. This social graph logic is completely abstracted away from the UI into an enterprise-grade custom React hook (`useRelationship`). This design enforces absolute relational integrity across all query operations, entirely preventing split-brain application state mismatches between directory views and timeline canvas feeds.

### 2. Spec-Compliant, Anti-Loop Fetch Interceptor Layer
Features a custom-built, middleware-driven network fetch interceptor wrapper (`customFetch`). 
* **Spec Compliance:** Correctly intercepts HTTP `204 No Content` and `205 Reset Content` responses, bypassing string reader exceptions and constructing clean, native browser `Response` streams with explicit `null` bodies.
* **Redirection Protection:** Intercepts `401 Unauthorized` token expiration triggers, purges storage variables, and invokes non-cyclic `window.location.replace` history events to stop infinite recursive request loops.

### 3. Asynchronous Binary Media & Cascade Deletion Pipelines
Integrates Express database controllers with external Cloudinary object storage layers. Destructive data tasks trigger clean, cascading cleanups to prevent orphan rows and cloud storage leaks across three core pipelines:
* **Phase 1 (Comments):** Users can drop comments natively. Post authors gain moderator override access to purge third-party comments on their own canvas.
* **Phase 2 (Posts):** Post deletions purge the relational row, clear nested comments, and trigger an immediate cloud storage asset delete.
* **Phase 3 (Account Destruction):** Handled via a secure, double-confirmation modal guard. The account deletion triggers a cascading delete across the profile, all published media, and connection entries in the database. A guest account lock (`isGuest`) is woven into the engine to shield public sandbox accounts from accidental drops.

### 4. Semantic HTML & WCAG AA Accessibility Tokenization
The application layer is entirely emoji-free, utilizing vector paths from `lucide-react` and relying strictly on the First Rule of ARIA by preferring native HTML semantics over artificial helpers:
* **Programmatic Form Associations:** Inputs and textareas pair with explicit native `<label>` tags and matching `htmlFor` attributes, using off-screen clipping utilities (`.visuallyHidden`) to preserve visual aesthetics.
* **Link Consolidation:** Combined redundant, double-tab layout targets into single, semantic blocks, reducing tab-navigation overhead on content cards by 50%.
* **Outline and Landmark Purity:** Restructured layout files to ensure exactly one visible `<main>` landmark exists per page view with sequential heading ranks (`<h1>` $\rightarrow$ `<h2>`).
* **Contrast Controls:** Driven by CSS Custom Properties tied to `data-` HTML tags. Every palette, including the hot pink and neon green Cyberpunk theme, guarantees a minimum 4.5:1 text-to-background contrast ratio (scaling up to 11.23:1 on core panels).

## 📋 System Requirements and Dependencies

* Node.js (Version 18.0.0 or higher)
* PostgreSQL Core Instance (Version 15.0 or higher)
* Cloudinary Storage Account API Keys

## 🔑 Centralized Environment Infrastructure

Create a `.env` file in the application root directory containing the following configuration keys:

```ini
# Database Core Storage Credentials
DATABASE_URL="postgresql://username:password@localhost:5432/socialsphere_dev?schema=public"
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/socialsphere_test?schema=public"

# Backend Engine Security Runtime Variables
PORT=3000
JWT_SECRET="your_production_grade_jwt_secret_hash_key"

# Third-Party External Media Cloud API Providers
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Frontend Build Matrix Environmental Bindings
VITE_API_URL="http://localhost:3000"
```

## 🚀 Local Boot Sequence Instructions

### 1. Initialize the Database Engine
Navigate to the relational database folder, run deep package initialization loops, and migrate the schemas into your engine instance:
```bash
cd db
npm install
npm run migrate:dev
npm run seed
```

### 2. Launch the Express REST API
Initialize server package footprints and boot the application router matrix:
```bash
cd ../backend
npm install
npm run dev
```

### 3. Mount the React Application
Boot the client compilation server to render your visual assets:
```bash
cd ../frontend
npm install
npm run dev
```
The client runtime automatically binds to port 5173 and mounts onto your local loopback browser framework. To execute your complete frontend automated testing registry and preview optimized production build chunk splits locally:
```bash
npm run test
npm run build
npm run preview
```
