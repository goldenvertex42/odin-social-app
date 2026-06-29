import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext/AuthContext';
import { ThemeProvider } from './context/ThemeContext/ThemeContext';

import ProtectedRoute from './components/auth/ProtectedRoute/ProtectedRoute';
import LoginForm from './components/auth/LoginForm/LoginForm';
import RegisterForm from './components/auth/RegisterForm/RegisterForm';
import AuthSuccess from './components/auth/AuthSuccess/AuthSuccess';

import SocialFeed from './views/SocialFeed/SocialFeed';
import UserIndex from './views/UserIndex/UserIndex';
import ProfileView from './views/ProfileView/ProfileView';
import PostView from './views/PostView/PostView';
import ProfileEditView from './views/ProfileEditView/ProfileEditView';

const router = createBrowserRouter([
  /* --- Public Route Nodes --- */
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

  /* --- Protected App Workspace Boundaries --- */
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
        path: '/posts/:postId',
        element: <PostView />,
      },
      {
        path: '/settings',
        element: <ProfileEditView />,
      },
    ],
  },

  /* --- Fallback Redirect Hook --- */
  {
    path: '*',
    element: <Navigate to="/feed" replace />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </AuthProvider>
  );
}
