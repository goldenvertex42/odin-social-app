# Stateless REST API Engine and Routing Layer

The SocialSphere backend is an Express-driven, stateless REST API server focused on asynchronous request processing, session token translation, and image data multi-part streaming.

## Technical Execution Matrix

* **Security Guardrails**: Enforces secure CORS request configurations and intercepts malformed parameters using robust validation blocks.
* **Authentication Pipelines**: Implements Passport.js and JSON Web Tokens (JWT) to secure user endpoints. It runs extraction scripts that verify request validity on every endpoint hit without managing state objects on the server.
* **Media Handling**: Streams files directly to Cloudinary cloud nodes using chunked binary multipart streams via Multer storage layers.

## Tested Endpoints Protocol

### Authentication Contexts (`/api/auth`)
* `POST /register`: Accepts raw payloads, builds fallback user identities using Gravatar parameters, and generates access tokens.
* `POST /login`: Validates local text credentials and activates user network availability visibility parameters.
* `POST /logout`: Terminates active user tracking sessions and resets presence markers back to false.
* `POST /guest`: Generates an ephemeral recruiter session using pre-configured color presets.

### Social Feeds Contexts (`/api/posts`)
* `GET /feed`: Aggregates posts published by the user and their accepted follow connections, sorted descending chronologically.
* `GET /user/:id`: Compiles an individual user's published history stack.
* `POST /`: Validates and writes fresh content blocks with optional multi-part media attachments.

### Communication Contexts (`/api/posts/:postId/comments`)
* `POST /`: appends threaded replies onto active post canvas layers.
* `GET /`: Pulls chronological discussion streams in ascending order (oldest first).

## Continuous Integration Verification Testing

The API uses Jest and Supertest to evaluate integration behavior against an isolated test database instance. 

To run the full backend testing suite:
```bash
npm run test
```
The test runner boots cleanly, resets tables dynamically via centralized cleanup helpers before each hook execution, and clears connections silently post-evaluation to prevent open loop hangs.
