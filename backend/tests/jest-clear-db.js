import { prisma } from '../../db/src/index.js';

export const clearDatabase = async () => {
  // Must clear tables in reverse order of foreign key relationships
  // to avoid blocking constraint violations
  await prisma.commentLike.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});
};