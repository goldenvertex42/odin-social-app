# SocialSphere Enterprise Monorepo Application Architecture

A full-stack, decoupled social media web application engineered with a focus on type-safe relational models, dynamic design tokens, accessible theme engines, and high-performance asynchronous runtime architectures validated by automated test runner cycles.

## Architectural Overview

SocialSphere is structured as a modular monorepo, cleanly separating the user-facing single-page application from the database modeling layer and the stateless REST API. The platform enforces absolute isolation of concerns, utilizing JSON Web Tokens (JWT) for secure authentication transitions, custom fetch interceptors to block recursive network render loops, and integrated media cloud stream cleanup pipelines.

## Monorepo Project Structure

```text
├── db/                       # Relational Database Modeling Directory
│   ├── prisma/               # Schema Definitions and Seeding Scripts
│   └── src/                  # Centralized Prisma Client Instantiation Node
├── backend/                  # Stateless REST API Express Engine
│   ├── src/
│   │   ├── config/           # Middleware and Security Configurations
│   │   ├── middleware/       # Upload Streams and Authentication Guards
│   │   ├── routes/           # Feature Controllers and Integration Routes
│   │   └── utils/            # Cryptographic and Token Helpers  
│   └── tests/                # Jest & Supertest API Route Coverage Suites
└── frontend/                 # High-Performance Single Page React Client
    ├── src/
    │   ├── components/       # Decoupled, Atomic UI Modular Elements
    │   ├── context/          # Identity Global State Management Wrappers
    │   ├── styles/           # Centralized Fluid Tokenization Themes
    │   ├── utils/            # Anti-Loop Network Interceptor Modules
    │   └── views/            # Route Orchestrator Canvas Components
    └── tests/                # Vitest & React Testing Library Setup File
```
## System Features

### 1. Bidirectional Relationship Engine
Implements a strict, four-part relational state machine (NOT_FOLLOWING, REQUEST_SENT, REQUEST_RECEIVED, FOLLOWING) utilizing atomic database upserts. This design enforces relational integrity across all query operations, entirely preventing race conditions or split-brain application state mismatches between user directory views and profile timeline canvasses.

### 2. Anti-Loop Fetch Interceptor Layer
Features a custom-built, middleware-driven network fetch wrapper that isolates API transaction contexts. This architecture intercepts dynamic state transformations and cyclic endpoint dependencies, providing an ironclad guarantee against recursive UI re-rendering cascades in React.

### 3. Asynchronous Binary Media Cleanup
Integrates Express middleware routing filters directly with external Cloudinary storage nodes. Deleting a post, comment thread, or an entire user account triggers an immediate binary asset purge across cloud hosting instances, preventing storage leaks and orphaned files.

### 4. WCAG AA Accessibility Tokenization
The application layer is entirely emoji-free and driven by responsive design tokens across 6 distinct client theme matrices. The design system enforces native user :focus-visible outlines and mathematically guarantees a minimum 4.5:1 text-to-background contrast ratio to pass WCAG AA standards.

## System Requirements and Dependencies

* Node.js (Version 18.0.0 or higher)
* PostgreSQL Core Instance (Version 15.0 or higher)
* Cloudinary Storage Account API Keys

## Centralized Environment Infrastructure

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

## Local Boot Sequence Instructions

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
The client runtime automatically binds to port 5173 and mounts onto your local loopback browser framework.
