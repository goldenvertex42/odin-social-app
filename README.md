# SocialSphere Full-Stack Social Media Application

SocialSphere is a full-stack social media platform where users can connect, share content, and manage their profiles. It features a modern, responsive user interface and a secure backend built to handle data smoothly.

## How the App Works

This project is organized as a monorepo (a single project folder that contains all parts of the app). It is split into three main sections to keep the code organized and easy to maintain:
* **Frontend (User Interface):** Built with React. This is the visual part of the app that users interact with.
* **Backend (API):** Built with Express and Node.js. This acts as the bridge between the frontend and the database. It handles user logins and processes data.
* **Database:** Powered by PostgreSQL and Prisma. This is where all the user accounts and posts are safely stored.

## Project Structure

```text
├── db/                         # Database setup and structure
│   ├── prisma/                 # Schema and seed script
│   └── src/                    # Connect database and backend
├── backend/                    # Server and API
│   ├── src/
│   │   ├── config/             # Login and image upload config
│   │   ├── middleware/         # Multer implementation
│   │   ├── routes/             # Features and API endpoints
│   │   └── utils/              # Helper functions
│   └── tests/                  # Jest & Supertest API Test Setup
└── frontend/                   # React user interface
    ├── src/
    │   ├── components/         # Reusable visual parts of the app, organized by feature
    │   │   ├── auth/           # Login and registration
    │   │   ├── layout/         # Static page frames
    │   │   ├── network/        # User cards for networking
    │   │   ├── profile/        # Profile settings components
    │   │   ├── social/         # Social Feed sub-components
    │   │   └── ui/             # Image modal/preview
    │   ├── context/            # Auth and theme context providers
    │   ├── hooks/              # Networking and post interaction hooks
    │   ├── styles/             # Global styles and theme definitions
    │   ├── utils/              # Custom fetch - token handling, content parsing, environment conditions
    │   └── views/              # Page orchestrators using sub-components
    └── tests/                  # RTL and vitest config
```

## 🛠️ System Features

### 1. Follow and Friend Request System
Manages social connections using four distinct states: NOT_FOLLOWING, REQUEST_SENT, REQUEST_RECEIVED, and FOLLOWING.
* All the complex database and connection logic is extracted into a custom React hook called useRelationship.
* This keeps the UI code clean and ensures user lists, profile pages, and news feeds always show the same accurate connection status.

### 2. Custom API Fetch Wrapper (customFetch)
A custom wrapper around the native browser fetch API to handle common network tasks automatically:
* **Empty Responses:** Correctly reads and handles 204 No Content or 205 Reset Content responses without crashing the app.
* **Auto-Logout:** Detects 401 Unauthorized errors (like an expired login token), clears local storage, and safely redirects the user to the login page without causing infinite page-reload loops.

### 3. Media Uploads & Automatic Cleanup
Handles user images by connecting the Express backend to Cloudinary cloud storage. It includes safety checks to delete files when they are no longer needed:
* **Comments:** Users can post and delete comments they have written. The author of a post has permission to delete any comment left on their own post.
* **Posts:** Deleting a post automatically removes its row from the database, deletes all related comments, and removes the uploaded image, if there is one, from Cloudinary.
* **Account Deletion:** Users can permanently delete their accounts using a confirmation popup. This triggers a chain reaction that deletes their profile, images, posts, and connections. A guest lock (isGuest) prevents public demo accounts from being accidentally deleted.

### 4. Accessibility (a11y) & Themes
Built with native web standards and web accessibility guidelines (WCAG AA) in mind:
* **Forms:** Every input field uses a semantic <label> tag. Screen-reader-only labels use a .visuallyHidden CSS class to stay invisible to sighted users while remaining readable for assistive tech.
* **Clean Navigation:** Combined redundant links on post cards to cut keyboard tab-navigation time in half.
* **Structure:**  Pages strictly follow HTML landmark rules, using exactly one <main> tag per view and keeping headings (<h1> to <h2>) in sequential order.
* **High Contrast:** Uses CSS variables tied to HTML data- attributes for switching themes. Every palette meets accessible color contrast standards.

## System Requirements

Before running this project, make sure you have the following installed:

* Node.js (Version 18.0.0 or higher)
* PostgreSQL (Version 15.0 or higher)
* A free Cloudinary Account (for handling image uploads)

## Environment Variables

Create a file named .env in the root folder of the project and add the following keys:

```ini
# Database Connection Strings
DATABASE_URL="postgresql://username:password@localhost:5432/socialsphere_dev?schema=public"
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/socialsphere_test?schema=public"

# Backend Server Settings
PORT=3000
JWT_SECRET="your_production_grade_jwt_secret_hash_key"

# Cloudinary Image Hosting Credentials
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Frontend API URL
VITE_API_URL="http://localhost:3000"
```

## How to Run the App Locally

### 1. Setup the Database
Navigate to the database folder, install dependencies, run your migrations to build the tables, and seed the initial data:
```bash
cd db
npm install
npm run migrate:dev
npm run seed
```

### 2. Start the Backend Server
Open a new terminal window or navigate back, install the backend files, and start the Express server in development mode:
```bash
cd ../backend
npm install
npm run dev
```

### 3. Start the Frontend React Client
Open another terminal window, install the frontend files, and start the local development server:
```bash
cd ../frontend
npm install
npm run dev
```

The app will open locally at http://localhost:5173.

### Run Dev Concurrently
You can also execute the dev command from the root directory, and it will run both the backend and frontend for you:
```bash
npm run dev
```
