// This service will manage all HTTP requests related to authentication.
// For now, the actual fetch calls are within the authSlice.ts for simplicity with createAsyncThunk.
// As the application grows, you might centralize all fetch logic here
// and have thunks call these service functions.

const API_URL = '/api/auth/'; // Base URL for auth endpoints

interface RegisterResponse {
  message: string;
  userId: string;
  // Add other expected fields from your backend
}

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  // Add other expected fields
}

// Example of how you might structure a dedicated service function:
// (This is not directly used by the current authSlice.ts, which has fetch inline)
const register = async (userData: any): Promise<RegisterResponse> => {
  const response = await fetch(API_URL + 'register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }
  return response.json();
};

const login = async (credentials: any): Promise<LoginResponse> => {
  const response = await fetch(API_URL + 'login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }
  return response.json();
};

// Logout usually doesn't require an API call if using JWT client-side invalidation,
// but if you have a server-side logout (e.g., token blacklisting):
const logout = async () => {
  // Example: if you had a /api/auth/logout endpoint that needs to be called
  // const response = await fetch(API_URL + 'logout', { method: 'POST' });
  // if (!response.ok) throw new Error('Logout failed');
  // return response.json();
  localStorage.removeItem('token'); // Standard client-side JWT logout
};

const authService = {
  register, // Not used by current slice, but here for structure
  login,    // Not used by current slice, but here for structure
  logout,
};

export default authService;
