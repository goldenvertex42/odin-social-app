import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext/AuthContext';
import { ThemeProvider } from './context/ThemeContext/ThemeContext';

// Import Layout / Security Guards
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Import Feature Views (To be created next)
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
import AuthSuccess from './components/AuthSuccess/AuthSuccess';

// Temporary fallback UI anchors for index routes
const PlaceholderFeed = () => <div><h2>Chronological Post Feed Dashboard View</h2><p>Responsive layout grids coming next.</p></div>;
const PlaceholderUsers = () => <div><h2>Platform Users Index Feed</h2><p>Follow status graph buttons go here.</p></div>;

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
        element: <PlaceholderFeed />,
      },
      {
        path: '/explore',
        element: <PlaceholderUsers />,
      },
      {
        path: '/users/:id',
        element: <div>User Individual Profile Dynamic Sub-Canvas Layout Container</div>,
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
