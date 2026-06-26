# Relational Database Layer: Schema Modeling and Migration Engine

This directory contains the domain logic layer responsible for data persistence, schema mutations, and constraint mapping using Prisma ORM.

## Relational Schema Architecture

The database is built on top of a highly optimized PostgreSQL relational instance, enforcing data integrity through relational keys, cascading deletion handlers, and unique indexing strategies.

### Core Entity Definitions

* **User**: Tracks member credentials, profile content, active workspace preferences, and application session presence parameters.
* **Post**: Contains text bodies, generated image references, author relational bindings, and timestamp markers.
* **Comment**: Embedded transactional strings linked to posts, managing chronological discussion tracks.
* **PostLike / CommentLike**: Junction tables utilizing composite primary indexing models to map engagement fields cleanly while eliminating duplicate entry overflows.
* **Follow**: Tracks multi-stage social connection networks, managing an internal status state array (`PENDING`, `ACCEPTED`).

## Performance and Optimization Strategies

### 1. Composite Unique Indexing
Engagement toggles map queries through multi-column indexes to look up values instantly without exhausting the system's runtime resources:
```prisma
model PostLike {
  postId String
  userId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([postId, userId])
}
```

### 2. Cascading Deletion Safety Chains
To prevent database row bloat and orphan references, post modifications automatically handle nested dependency data wipes down the cascade line whenever a post or comment node is purged by its creator.

## Available Utility Commands

* `npm run migrate:dev`: Generates SQL tracking sheets and updates the active developer PostgreSQL container structure.
* `npm run studio`: Fires up a visual browser client dashboard to inspect local tables and database seeds directly.
