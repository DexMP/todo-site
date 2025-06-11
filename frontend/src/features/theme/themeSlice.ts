import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface ThemeState {
  currentTheme: 'light' | 'dark';
}

// Function to get initial theme from localStorage or system preference
const getInitialTheme = (): 'light' | 'dark' => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }
  // Optional: Check system preference if no theme is stored
  // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  //   return 'dark';
  // }
  return 'light'; // Default to light theme
};

const initialState: ThemeState = {
  currentTheme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.currentTheme = action.payload;
      localStorage.setItem('theme', action.payload); // Persist to localStorage
    },
    toggleTheme(state) {
      const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
      state.currentTheme = newTheme;
      localStorage.setItem('theme', newTheme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

export const selectCurrentTheme = (state: RootState) => state.theme.currentTheme;

export default themeSlice.reducer;
