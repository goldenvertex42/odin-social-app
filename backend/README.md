# Backend: Express REST API Server

This is the backend server for SocialSphere. It is a stateless REST API built with Node.js and Express that connects our React frontend to our PostgreSQL database, manages user authentication, and handles image uploads.

## Core Architecture & Features

* **Security Guardrails:** Uses CORS to control which web domains can talk to our API. It includes middleware to quickly catch and stop invalid or corrupted requests before they strain the server.
* **Simple Authentication (JWT):** Uses Passport.js and JSON Web Tokens (JWT). When a user logs in, they get a secure token. The server checks this token on protected routes instead of storing heavy user session data in the server's memory.
* **Cloud Image Uploads:** Processes user images using Multer and streams them directly to Cloudinary cloud storage. This means the server never saves permanent files onto its own local hard drive.

## API Endpoints

### 1. Authentication (`/api/auth`)
* `POST /register` – Creates a new user account, assigns a default Gravatar profile picture if none is provided, and logs them in.
* `POST /login` – Checks user credentials and issues a secure login token.
* `POST /logout` – Logs the user out and clears their active session.
* `POST /guest` – Creates a temporary guest account with pre-set data so recruiters can easily test the app.

### 2. Social Feeds & Posts (`/api/posts`)
* `GET /feed` – Fetches a chronological feed of posts from the user and the people they follow.
* `GET /user/:id` – Fetches a specific user's post history.
* `POST /` – Creates a new post with text and optional image uploads.
* `DELETE /:id` – Deletes a post, all of its comments, and automatically removes the attached image from Cloudinary.

### 3. Comments (`/api/comments`)
* `POST /post/:postId` – Adds a new comment to a specific post.
* `GET /post/:postId` – Fetches all comments for a post, sorted from newest to oldest.
* `DELETE /:commentId` – Deletes a comment. To make moderation easy, a comment can be deleted by either the person who wrote the comment OR the owner of the post.

### 4. User Profiles & Account Deletion (`/api/users`)
* `PUT /profile` – Updates profile details and user theme preferences.
* `DELETE /profile` – Permanently deletes a user's account. This deletes their profile, posts, comments, likes, and all of their uploaded images from Cloudinary. A safety check prevents the public guest account from being deleted.

## Testing the API

We use **Jest** and **Supertest** to test our API endpoints against a separate, isolated test database. The test runner automatically resets the database tables before each test runs to make sure results are accurate.

To run the backend test suite:
```bash
npm run test
```
