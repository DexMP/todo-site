import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectAuthError, selectAuthLoading, clearError, selectIsAuthenticated } from '../authSlice';
import { AppDispatch } from '../../../app/store'; // Adjusted path

const LoginForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading) === 'pending';
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Clear auth error when component unmounts or before a new submission
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    dispatch(clearError());

    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        setFormError('Invalid email format.');
        return;
    }

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Successful login is handled by the slice updating isAuthenticated.
      // Parent component or App.tsx can react to isAuthenticated change for redirection.
      // For this component, we can clear fields.
      setEmail('');
      setPassword('');
      // If not using automatic redirection, you could add:
      // alert('Login successful!');
    } catch (error: any) {
      // Error is handled by the slice and selector
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    // This component shouldn't be rendered if authenticated, App.tsx handles redirection.
    // However, as a fallback or during transition:
    return <p className="text-center text-green-500">You are already logged in. Redirecting...</p>;
  }

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-text-primary mb-6">
        Sign in to your account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">{formError}</p>}
        {authError && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">Error: {authError}</p>}

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-text-secondary">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="appearance-none block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-text-secondary">
            Password
          </label>
          <div className="mt-1">
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="appearance-none block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text bg-button-primary-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
