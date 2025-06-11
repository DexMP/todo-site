import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, AppDispatch, RootState } from './app/store';
import AuthPage from './features/auth/AuthPage';
import { selectIsAuthenticated, logout, selectAuthToken } from './features/auth/authSlice';
import DashboardPage from './pages/DashboardPage';
import { initSocket, disconnectSocket } from './services/socketService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { selectCurrentTheme } from './features/theme/themeSlice'; // Import theme selector
import ThemeSwitcher from './components/ThemeSwitcher'; // Import ThemeSwitcher

// A simple component to show after login (Now DashboardPage will serve this role)
// const HomePage: React.FC = () => {
//   const dispatch = useDispatch<AppDispatch>();
//   const handleLogout = () => {
//     dispatch(logout());
//   };
//   return (
//     <div>
//       <h2>Welcome!</h2>
//       <p>You are logged in.</p>
//       <button onClick={handleLogout}>Logout</button>
//     </div>
//   );
// };

// A component to wrap routes that require authentication
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

const AppContent: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authToken = useSelector(selectAuthToken);
  const currentTheme = useSelector(selectCurrentTheme); // Get current theme
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Apply theme class to root element
    const root = window.document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // localStorage.setItem('theme', currentTheme); // This is handled by the slice now
  }, [currentTheme]);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      console.log("User authenticated, initializing socket.");
      initSocket(authToken);
    } else {
      console.log("User not authenticated or no token, disconnecting socket.");
      disconnectSocket();
    }
    return () => {
      // Optional: disconnectSocket(); // If AppContent can unmount during session
    };
  }, [isAuthenticated, authToken]);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Router>
      <div className="bg-background text-text-primary min-h-screen flex flex-col">
        <nav className="bg-card-background shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="font-semibold text-lg hover:text-primary-accent transition-colors">
                  Task Manager
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {!isAuthenticated && (
                  <Link to="/auth" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-accent hover:text-white transition-colors border border-border-color hover:border-primary-accent">
                    Login/Register
                  </Link>
                )}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-accent hover:text-white transition-colors border border-border-color hover:border-primary-accent"
                  >
                    Logout
                  </button>
                )}
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8 flex-grow">
          <Routes>
            <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
            <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          {/* Redirect root to dashboard if authenticated, else to auth */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
            }
          />
          {/* Add other routes here */}
        </Routes>
      </div>
    </Router>
  );
};

// Main App component that provides the Redux store
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Provider>
  );
};

export default App;
