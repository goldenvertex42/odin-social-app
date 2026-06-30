# Stateless REST API Engine and Routing Layer

The SocialSphere backend is an Express-driven, stateless REST API server focused on asynchronous request processing, session token translation, cascading data erasure pipelines, and multipart cloud media binary streaming.

## Technical Execution Matrix

* **Security Guardrails**: Enforces secure Cross-Origin Resource Sharing (CORS) policies matching dynamic production environment domains. The server features an automated, anti-loop proxy layer that immediately halts invalid requests, blocking malicious traffic or corrupted sessions at the perimeter.
* **Stateless Authentication Pipelines**: Implements Passport.js and JSON Web Tokens (JWT) to secure user endpoints. It runs extraction scripts that verify request cryptographics on every endpoint hit without managing heavy, state-bloated session objects on the server.
* **Media Stream Handling**: Streams files directly to Cloudinary cloud nodes using chunked binary multipart streams via Multer storage memory buffers, eliminating local temporary file storage overhead entirely.

## 🔌 Tested Endpoints Protocol

### 1. Authentication Contexts (`/api/auth`)
* `POST /register`: Accepts payload strings, maps fallback user identities using Gravatar, and generates signed access tokens.
* `POST /login`: Validates local text credentials and activates user network availability visibility parameters.
* `POST /logout`: Terminates active user tracking sessions and resets presence markers back to false.
* `POST /guest`: Generates an ephemeral recruiter session using pre-configured color presets.

### 2. Social Feeds & Media Deletion Contexts (`/api/posts`)
* `GET /feed`: Aggregates posts published by the user and their accepted follow connections, sorted descending chronologically.
* `GET /user/:id`: Compiles an individual user's published history stack.
* `POST /`: Validates and writes fresh content blocks with optional multi-part media attachments.
* `DELETE /:id`: **[Cascade Pipeline]** Deletes a post, drops all nested relational comment nodes, and triggers an immediate remote binary media destruction sequence on Cloudinary to prevent orphan storage leaks.

### 3. Comment Thread Contexts (`/api/comments`)
* `POST /post/:postId`: Appends threaded replies onto active post canvas layers.
* `GET /post/:postId`: Pulls chronological discussion streams in descending order.
* `DELETE /:commentId`: **[Asymmetric Moderation Guard]** Validates whether the executing `currentUserId` matches the comment author OR the parent post author, authorizing post authors to moderate third-party comments on their own canvas.

### 4. Account Destruction Contexts (`/api/users`)
* `PUT /profile`: Updates basic user metadata text fields and theme configuration presets.
* `DELETE /profile`: **[Total Platform Purge]** Irreversibly purges a user's entire identity profile row. This action triggers a database cascade that wipes their authored posts, comment threads, likes, and relational connection rows, followed by a total cloud media asset clear. Features a protection shield (`isGuest`) to lock down the core recruiter sandbox profile.

## 🧪 Continuous Integration Verification Testing

The API uses **Jest** and **Supertest** to evaluate integration behavior against an isolated PostgreSQL test database instance. 

To run the full backend testing suite:
```bash
npm run test
```

The test runner boots cleanly, resets tables dynamically via centralized cleanup helpers before each hook execution, and clears connections silently post-evaluation to prevent open loop hangs.
