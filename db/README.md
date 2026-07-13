# Database Layer: Prisma & PostgreSQL

This directory handles everything related to our database. We use **Prisma ORM** to connect our backend server to a **PostgreSQL** database, manage our data tables, and handle database updates.

## Database Tables (Schema)

Our database is built with clear relationships between tables. It includes built-in safety rules (cascading deletes) to clean up related data automatically and index rules to prevent duplicate entries.

### Core Tables
* **User:** Stores user account details, profile info, and application settings.
* **Post:** Contains text, links to uploaded images, creation timestamps, and a connection to the user who wrote it.
* **Comment:** Stores text responses linked directly to specific posts and authors.
* **PostLike / CommentLike:** Small helper tables that connect users to the posts or comments they like. They make sure a user can only like an item once.
* **Follow:** Tracks friend requests and connections between users using a status field (`PENDING` or `ACCEPTED`).

## Performance & Data Safety

### 1. Smart Duplication Prevention (Composite Keys)
To make sure a user cannot like the exact same post multiple times, we use composite IDs. This combines the `postId` and `userId` into a single unique identifier, allowing the database to instantly find or reject records:

```prisma
model PostLike {
  postId String
  userId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
}
```

### 2. Automatic Cleanup (Cascading Deletes)
To keep the database clean and prevent broken data trails, we use `onDelete: Cascade`. If a user deletes a post, the database automatically deletes every comment and like attached to that specific post at the exact same time.

## Database Commands

Run these commands inside the `db/` directory to manage your local database:

* `npm run migrate:dev` – Saves changes made to your schema file and updates your local PostgreSQL database tables.
* `npm run studio` – Opens a visual dashboard in your browser to view, add, or edit data inside your local database tables.
