import { PrismaClient, FollowStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Purging existing database tables...');
  // Delete in specific dependency order to avoid foreign key relation blocks
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

  // Create an explicit stable developer test account first
  const devUser = await prisma.user.create({
    data: {
      email: 'developer@socialsphere.com',
      username: 'dev_mode',
      displayName: 'Lead Developer',
      passwordHash: '$2b$10$2TC9RtF/OEaleV7xnxZ75uqxwfQ3HPr.FLbS4MgT3S6Lk7YwzXybe', // Dummy hash
      avatarUrl: `https://gravatar.com/avatar/${faker.string.uuid()}?d=mp&s=150`,
      bio: 'Seeding account built for checking UI rendering parameters.',
      colorPalette: 'cyberpunk', // Explicit active configuration token
      colorScheme: 'dark',
      isOnline: true,
      isGuest: false,
    },
  });
  users.push(devUser);

  // Generate remaining random platform users using correct track definitions
  for (let i = 0; i < usersCount - 1; i++) {
    const email = faker.internet.email();
    
    // Construct a Gravatar URL using a unique identifier.
    // The '?d=identicon' or '?d=robohash' parameter guarantees a unique, distinct fallback graphic per user!
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
        avatarUrl: gravatarUrl, // 🎯 Perfectly compatible! Saved as a real, stable URL string.
        bio: faker.lorem.sentence(),
        colorPalette: faker.helpers.arrayElement(paletteOptions),
        colorScheme: faker.helpers.arrayElement(schemeOptions),
        isOnline: faker.datatype.boolean(0.3),
        isGuest: faker.datatype.boolean(0.1),
      },
    });
    users.push(user);
  }

  console.log(`✅ Successfully generated ${users.length} unique user rows.`);

  // 2. GENERATE FOLLOW STATUS NETWORKS
  console.log('🔗 Connecting user relationship networks...');
  for (const user of users) {
    // Pick 5 random unique targets for each user to interact with
    const targets = faker.helpers.arrayElements(
      users.filter((u) => u.id !== user.id),
      5
    );

    for (const target of targets) {
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: target.id,
          // Mix up pending vs accepted workflows
          status: faker.datatype.boolean(0.75) ? FollowStatus.ACCEPTED : FollowStatus.PENDING,
        },
      });
    }
  }

  // 3. GENERATE POSTS, COMMENTS, AND INTERACTIVE LIKES
  console.log('📝 Publishing chronological posts and interactive thread layers...');
  
  for (const user of users) {
    const randomSeed = faker.string.alphanumeric(10);
    const imageUrl = `https://picsum.photos/seed/${randomSeed}/600/800`;
    
    // Each user creates between 2 and 5 posts
    const postLoops = faker.number.int({ min: 2, max: 5 });

    for (let p = 0; p < postLoops; p++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
          // 40% chance a post contains an image link
          imageUrl: faker.datatype.boolean(0.4) ? imageUrl : null,
          authorId: user.id,
          // Stagger timestamps across the past month to check sorting indexes
          createdAt: faker.date.recent({ days: 30 }),
        },
      });

      // Generate post likes from a random group of users
      const postLikers = faker.helpers.arrayElements(users, faker.number.int({ min: 0, max: 8 }));
      for (const liker of postLikers) {
        await prisma.postLike.create({
          data: {
            postId: post.id,
            userId: liker.id,
          },
        }).catch(() => {}); // Catch block blocks accidental duplicate user errors
      }

      // Generate between 0 and 6 comments per post
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

        // Generate comment likes
        const commentLikers = faker.helpers.arrayElements(users, faker.number.int({ min: 0, max: 4 }));
        for (const liker of commentLikers) {
          await prisma.commentLike.create({
            data: {
              commentId: comment.id,
              userId: liker.id,
            },
          }).catch(() => {});
        }
      }
    }
  }


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
