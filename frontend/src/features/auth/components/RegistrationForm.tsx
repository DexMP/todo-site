import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, selectAuthError, selectAuthLoading, clearError } from '../authSlice';
import { AppDispatch } from '../../../app/store'; // Adjusted path

const RegistrationForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading) === 'pending';

  const [username, setUsername] = useState('');
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
    setFormError(null); // Clear previous form-specific errors
    dispatch(clearError()); // Clear previous Redux errors

    if (!username || !email || !password) {
      setFormError('All fields are required.');
      return;
    }

    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        setFormError('Invalid email format.');
        return;
    }

    // Password length check (example)
    if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
    }

    try {
      await dispatch(registerUser({ username, email, password })).unwrap();
      // Handle successful registration (e.g., redirect or show message)
      // This might be handled by a parent component or a navigation effect
      alert('Registration successful! Please login.');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (error: any) {
      // Error is already handled by the slice and selector,
      // but you can set form-specific errors if needed or log
      console.error('Registration failed:', error);
      // authError selector will display the error from Redux state
    }
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-extrabold text-text-primary mb-6">
        Create your account
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">{formError}</p>}
        {authError && <p className="text-center text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">Error: {authError}</p>}

        <div>
          <label htmlFor="reg-username" className="block text-sm font-medium text-text-secondary">
            Username
          </label>
          <div className="mt-1">
            <input
              id="reg-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="appearance-none block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-text-secondary">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="reg-email"
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
          <label htmlFor="reg-password" className="block text-sm font-medium text-text-secondary">
            Password
          </label>
          <div className="mt-1">
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
