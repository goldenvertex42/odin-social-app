/*
  Warnings:

  - The values [PENDING,ACCEPTED] on the enum `FollowStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FollowStatus_new" AS ENUM ('NOT_FOLLOWING', 'REQUEST_RECEIVED', 'REQUEST_SENT', 'FOLLOWING');
ALTER TABLE "public"."Follow" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Follow" ALTER COLUMN "status" TYPE "FollowStatus_new" USING ("status"::text::"FollowStatus_new");
ALTER TYPE "FollowStatus" RENAME TO "FollowStatus_old";
ALTER TYPE "FollowStatus_new" RENAME TO "FollowStatus";
DROP TYPE "public"."FollowStatus_old";
ALTER TABLE "Follow" ALTER COLUMN "status" SET DEFAULT 'NOT_FOLLOWING';
COMMIT;

-- AlterTable
ALTER TABLE "Follow" ALTER COLUMN "status" SET DEFAULT 'NOT_FOLLOWING';
