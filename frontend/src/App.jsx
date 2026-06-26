import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext/AuthContext';
import { ThemeProvider } from './context/ThemeContext/ThemeContext';

// Import Layout / Security Guards
import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';

// Import Feature Views (To be created next)
import LoginForm from './components/auth/LoginForm/LoginForm';
import RegisterForm from './components/auth/RegisterForm/RegisterForm';
import AuthSuccess from './components/auth/AuthSuccess/AuthSuccess';

// Temporary fallback UI anchors for index routes
import SocialFeed from './views/SocialFeed/SocialFeed';
import UserIndex from './views/UserIndex/UserIndex';
import ProfileView from './views/ProfileView/ProfileView';
import PostView from './views/PostView/PostView';
import ProfileEditView from './views/ProfileEditView/ProfileEditView';

// 🎯 MODERN ARCHITECTURE: Configure standard flat route parameters using object arrays
const router = createBrowserRouter([
  /* --- Public Unauthenticated Route Nodes --- */
  {
    path: '/login',
    element: 
    <div className="authContainer">
      <LoginForm />
    </div>,
  },
  {
    path: '/register',
    element: 
    <div className="authContainer">
      <RegisterForm />
    </div>,
  },
  {
    path: '/auth-success',
    element: <AuthSuccess />,
  },

  /* --- Secured Protected App Workspace Boundaries --- */
  {
    element: <ProtectedRoute />, // Secures all child route nodes underneath
    children: [
      {
        path: '/feed',
        element: <SocialFeed />,
      },
      {
        path: '/explore',
        element: <UserIndex />,
      },
      {
        path: '/users/:id',
        element: <ProfileView />,
      },
      {
        path: '/posts/:postId', // Added direct deep-linked post path parameter configuration
        element: <PostView />,
      },
      {
        path: '/settings', // Added direct layout screen route mapping for user profile edits
        element: <ProfileEditView />,
      },
    ],
  },

  /* --- Absolute Baseline Fallback Redirect Hook --- */
  {
    path: '*',
    element: <Navigate to="/feed" replace />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* Inject your optimized object router context into the virtual DOM grid matrix */}
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
