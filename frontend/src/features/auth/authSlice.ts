import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store'; // Assuming store.ts is in src/app

// Placeholder for API service - replace with actual API calls
const authAPI = {
  register: async (userData: any) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    return response.json();
  },
  login: async (credentials: any) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    return response.json();
  },
};

interface AuthState {
  user: { id: string; username: string; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null | undefined; // Allow undefined for thunk.rejected.meta.error
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'), // Persist token
  isAuthenticated: !!localStorage.getItem('token'),
  loading: 'idle',
  error: null,
};

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response; // Expects { message: string, userId: string }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: any, { dispatch, rejectWithValue }) => {
    try {
      const data = await authAPI.login(credentials); // Expects { message: string, token: string, user: object }
      if (data.token) {
        localStorage.setItem('token', data.token);
        dispatch(setCredentials(data)); // Dispatch action to update state
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: any; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Register User
    builder.addCase(registerUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = 'succeeded';
      // Optionally, you might want to log the user in directly or just show a success message
      console.log('Registration successful:', action.payload);
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
    });

    // Login User
    builder.addCase(loginUser.pending, (state) => {
      state.loading = 'pending';
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      // Credentials are set by the thunk calling dispatch(setCredentials(action.payload))
      state.loading = 'succeeded';
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = 'failed';
      state.error = action.payload as string;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;
