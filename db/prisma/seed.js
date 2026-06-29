import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Purging existing database tables...');
  await prisma.commentLike.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🌱 Seeding new platform data layers...');

  // 1. GENERATE USERS
  const usersCount = 20;
  const users = [];

  // Create stable developer test account
  const devUser = await prisma.user.create({
    data: {
      email: 'developer@socialsphere.com',
      username: 'dev_mode',
      displayName: 'Lead Developer',
      passwordHash: '$2b$10$2TC9RtF/OEaleV7xnxZ75uqxwfQ3HPr.FLbS4MgT3S6Lk7YwzXybe', 
      avatarUrl: `https://gravatar.com/avatar/${faker.string.uuid()}?d=mp&s=150`,
      bio: 'Seeding account built for checking UI rendering parameters.',
      colorPalette: 'cyberpunk', 
      colorScheme: 'dark',
      isOnline: true,
      isGuest: false,
    },
  });
  users.push(devUser);

  const guestUser = await prisma.user.create({
    data: {
      email: 'visitor@socialsphere.com',
      username: 'visitor1',
      displayName: `Visitor`,
      passwordHash: '$2b$10$2TC9RtF/OEaleV7xnxZ75uqxwfQ3HPr.FLbS4MgT3S6Lk7YwzXybe', 
      avatarUrl: `https://gravatar.com/avatar/${faker.string.uuid()}?d=mp&s=150`,
      bio: 'Explore mode activated. Previewing system architecture and decoupled state machines.',
      colorPalette: 'default',
      colorScheme: 'light',
      isOnline: true,
      isGuest: true,
    },
  });
  users.push(guestUser);

  for (let i = 0; i < usersCount - 2; i++) {
    const email = faker.internet.email();
    const gravatarUrl = `https://gravatar.com/avatar/${faker.string.uuid()}?d=mp&s=150`;
    const paletteOptions = ['nord', 'sunset', 'cyberpunk', 'obsidian', 'neonmint'];
    const schemeOptions = ['light', 'dark'];

    const user = await prisma.user.create({
      data: {
        email: email,
        username: faker.internet.username(),
        displayName: faker.person.fullName(),
        passwordHash: faker.internet.password(),
        googleId: faker.datatype.boolean(0.2) ? faker.string.uuid() : null,
        avatarUrl: gravatarUrl,
        bio: faker.lorem.sentence(),
        colorPalette: faker.helpers.arrayElement(paletteOptions),
        colorScheme: faker.helpers.arrayElement(schemeOptions),
        isOnline: faker.datatype.boolean(0.3),
        isGuest: false,
      },
    });
    users.push(user);
  }

  console.log(`✅ Successfully generated ${users.length} unique user rows.`);

  // 2. GENERATE FOLLOW STATUS NETWORKS
  console.log('🔗 Connecting user relationship networks...');
  for (const user of users) {
    if (user.id === guestUser.id) continue;

    const targets = faker.helpers.arrayElements(
      users.filter((u) => u.id !== user.id && u.id !== guestUser.id),
      5
    );

    for (const target of targets) {
      const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: user.id, followingId: target.id } }
      });

      if (existing) continue;

      const statuses = ['NOT_FOLLOWING', 'REQUEST_SENT', 'FOLLOWING'];
      const randomStatus = faker.helpers.arrayElement(statuses);

      if (randomStatus === 'FOLLOWING') {
        await prisma.follow.create({
          data: { followerId: user.id, followingId: target.id, status: 'FOLLOWING' }
        });
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: target.id, followingId: user.id } },
          update: { status: 'FOLLOWING' },
          create: { followerId: target.id, followingId: user.id, status: 'FOLLOWING' }
        });
      } else if (randomStatus === 'REQUEST_SENT') {
        await prisma.follow.create({
          data: { followerId: user.id, followingId: target.id, status: 'REQUEST_SENT' }
        });
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: target.id, followingId: user.id } },
          update: { status: 'REQUEST_RECEIVED' },
          create: { followerId: target.id, followingId: user.id, status: 'REQUEST_RECEIVED' }
        });
      } else {
        await prisma.follow.create({
          data: { followerId: user.id, followingId: target.id, status: 'NOT_FOLLOWING' }
        });
      }
    }
  }

  // 3. GENERATE POSTS, COMMENTS, AND INTERACTIVE LIKES
  console.log('📝 Publishing chronological posts and interactive thread layers...');
  for (const user of users) {
    const randomSeed = faker.string.alphanumeric(10);
    const imageUrl = `https://picsum.photos/seed/${randomSeed}/600/800`;
    const postLoops = faker.number.int({ min: 2, max: 5 });

    for (let p = 0; p < postLoops; p++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
          imageUrl: faker.datatype.boolean(0.4) ? imageUrl : null,
          authorId: user.id,
          createdAt: faker.date.recent({ days: 30 }),
        },
      });

      const postLikers = faker.helpers.arrayElements(users, faker.number.int({ min: 0, max: 8 }));
      for (const liker of postLikers) {
        await prisma.postLike.create({
          data: { postId: post.id, userId: liker.id },
        }).catch(() => {});
      }

      const commentLoops = faker.number.int({ min: 0, max: 6 });
      for (let c = 0; c < commentLoops; c++) {
        const commentAuthor = faker.helpers.arrayElement(users);
        const comment = await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            postId: post.id,
            authorId: commentAuthor.id,
            createdAt: faker.date.between({ from: post.createdAt, to: new Date() }),
          },
        });

        const commentLikers = faker.helpers.arrayElements(users, faker.number.int({ min: 0, max: 4 }));
        for (const liker of commentLikers) {
          await prisma.commentLike.create({
            data: { commentId: comment.id, userId: liker.id },
          }).catch(() => {});
        }
      }
    }
  }

  // 4. HYDRATE FEED STREAMS FOR THE SEEDED GUEST ACCOUNT
  console.log('✨ Hydrating feed streams for the Recruiter Guest account...');
  
  const activeCreators = await prisma.user.findMany({
    where: {
      id: { notIn: [guestUser.id, devUser.id] }
    },
    take: 6
  });

  const timelineTargets = [...activeCreators, devUser];

  for (const creator of timelineTargets) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: guestUser.id, followingId: creator.id } },
      update: { status: 'FOLLOWING' },
      create: { followerId: guestUser.id, followingId: creator.id, status: 'FOLLOWING' }
    });

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: creator.id, followingId: guestUser.id } },
      update: { status: 'FOLLOWING' },
      create: { followerId: creator.id, followingId: guestUser.id, status: 'FOLLOWING' }
    });
  }

  console.log(`🟢 Recruiter guest is now actively following ${timelineTargets.length} members.`);
  console.log('🚀 Database seeding operations finalized cleanly!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding process encountered a terminal exception:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
