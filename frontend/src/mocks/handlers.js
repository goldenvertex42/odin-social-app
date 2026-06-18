import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3000/api';

export const handlers = [
  // 1. USER REGISTRATION (/api/auth/register)
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();

    // Emulate basic server constraints check
    if (!body.email || !body.username || !body.password) {
      return HttpResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    return HttpResponse.json({
      message: 'User registered successfully.',
      token: 'mock-valid-jwt-string-from-msw', // Delivers the required session authorization string
      user: {
        id: 'brand-new-user-uuid',
        email: body.email.trim().toLowerCase(),
        username: body.username.trim().toLowerCase(),
        displayName: body.displayName ? body.displayName.trim() : body.username.trim(),
        avatarUrl: 'https://cloudinary.com',
        colorPalette: 'default',
        colorScheme: 'light',
        isOnline: true,
        isGuest: false
      }
    }, { status: 201 });
  }),
  
  // 2. STATELESS PROFILE GATEKEEPER (/api/auth/me)
  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized. Token missing.' }, { status: 401 });
    }
    return HttpResponse.json({
      id: 'user-alpha-id',
      email: 'alpha@odin.local',
      username: 'user_alpha',
      displayName: 'Odin Alpha',
      bio: 'Coding in a feature-based architecture pattern.',
      avatarUrl: 'https://cloudinary.com',
      colorPalette: 'default',
      colorScheme: 'light',
      isOnline: true,
      isGuest: false
    }, { status: 200 });
  }),

  // 3. LOCAL LOGIN ENGINE (/api/auth/login)
  http.post(`${API_URL}/auth/login`, async () => {
    return HttpResponse.json({
      message: 'Logged in successfully.',
      token: 'mock-valid-jwt-string-from-msw',
      user: {
        id: 'user-alpha-id',
        email: 'alpha@odin.local',
        username: 'user_alpha',
        displayName: 'Odin Alpha',
        bio: 'Coding in a feature-based architecture pattern.',
        avatarUrl: 'https://cloudinary.com',
        colorPalette: 'default',
        colorScheme: 'light',
        isOnline: true,
        isGuest: false
      }
    }, { status: 200 });
  }),

  // 4. RECRUITER INSTANT BYPASS (/api/auth/guest)
  http.post(`${API_URL}/auth/guest`, async () => {
    return HttpResponse.json({
      message: 'Guest workspace initialized successfully.',
      token: 'mock-guest-jwt-string',
      user: {
        id: 'guest-user-id',
        email: 'recruiter_guest_abc123@guest.odin.local',
        username: 'recruiter_guest_abc123',
        displayName: '✨ Recruiter Guest Profile',
        bio: 'Logged in via instant guest token access. Feel free to explore!',
        avatarUrl: 'https://cloudinary.com',
        colorPalette: 'cyberpunk',
        colorScheme: 'dark',
        isOnline: true,
        isGuest: true
      }
    }, { status: 201 });
  }),

  // 5. LOCAL LOGOUT ENGINE (/api/auth/logout)
  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true, message: 'Logged out successfully.' }, { status: 200 });
  }),

  // 6. SOCIAL FEED retrieval (/api/posts/feed)
  http.get(`${API_URL}/posts/feed`, () => {
    return HttpResponse.json([
      {
        id: 'post-1-id',
        content: 'Building the social media frontend in Vite!',
        imageUrl: 'https://cloudinary.com',
        createdAt: new Date().toISOString(),
        authorId: 'user-beta-id',
        author: {
          id: 'user-beta-id',
          username: 'user_beta',
          displayName: 'Odin Beta',
          avatarUrl: 'https://cloudinary.com',
          isOnline: true
        },
        _count: { likes: 5, comments: 2 }
      },
      {
        id: 'post-2-id',
        content: 'This is my personal update post on the feed.',
        imageUrl: null,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        authorId: 'user-alpha-id',
        author: {
          id: 'user-alpha-id',
          username: 'user_alpha',
          displayName: 'Odin Alpha',
          avatarUrl: 'https://cloudinary.com',
          isOnline: true
        },
        _count: { likes: 0, comments: 0 }
      }
    ], { status: 200 });
  }),

  // 7. THREADED COMMENTS RETRIEVAL (/api/comments/post/:postId)
  http.get(`${API_URL}/comments/post/:postId`, () => {
    return HttpResponse.json([
      {
        id: 'comment-1-id',
        content: 'This looks fantastic! Great progress.',
        createdAt: new Date().toISOString(),
        postId: 'post-1-id',
        authorId: 'user-alpha-id',
        author: {
          id: 'user-alpha-id',
          username: 'user_alpha',
          displayName: 'Odin Alpha',
          avatarUrl: 'https://cloudinary.com',
          isOnline: true
        },
        _count: { likes: 1 }
      }
    ], { status: 200 });
  }),

  // 8. USER PLATFORM INDEX DISCOVERY (/api/users)
  http.get(`${API_URL}/users`, () => {
    return HttpResponse.json([
      {
        id: 'user-beta-id',
        username: 'user_beta',
        displayName: 'Odin Beta',
        avatarUrl: 'https://cloudinary.com',
        bio: 'Hello world from Beta',
        colorPalette: 'default',
        colorScheme: 'light',
        isOnline: true,
        followStatus: 'FOLLOWING'
      },
      {
        id: 'user-gamma-id',
        username: 'user_gamma',
        displayName: 'Odin Gamma',
        avatarUrl: 'https://cloudinary.com',
        bio: 'Hello world from Gamma',
        colorPalette: 'nord',
        colorScheme: 'dark',
        isOnline: false,
        followStatus: 'NONE'
      }
    ], { status: 200 });
  })
];
