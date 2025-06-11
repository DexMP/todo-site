import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store'; // Adjust path as necessary
import projectService from './projectService'; // To be created

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  team_id?: string;
  created_at: string; // Assuming ISO string from backend
  updated_at: string; // Assuming ISO string from backend
}

export interface ProjectMember { // Exporting for use in components
  user_id: string;
  project_id: string;
  role: 'owner' | 'editor' | 'viewer';
  username?: string; // Denormalized, from backend
  email?: string;    // Denormalized, from backend
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[]; // Added for current project's members
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null | undefined;
  membersLoading: 'idle' | 'pending' | 'succeeded' | 'failed'; // Separate loading for members
  membersError: string | null | undefined; // Separate error for members
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  projectMembers: [], // Initialize as empty
  loading: 'idle',
  error: null,
  membersLoading: 'idle',
  membersError: null,
};

// Async Thunks
export const fetchProjects = createAsyncThunk('projects/fetchProjects', async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await projectService.getProjects(token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch projects');
  }
});

export const createProject = createAsyncThunk('projects/createProject', async (projectData: { name: string; description?: string }, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await projectService.createProject(projectData, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to create project');
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchProjectById', async (projectId: string, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await projectService.getProjectById(projectId, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch project by ID');
  }
});

export const updateProject = createAsyncThunk('projects/updateProject', async (projectData: Project, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await projectService.updateProject(projectData.id, projectData, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update project');
  }
});

export const deleteProject = createAsyncThunk('projects/deleteProject', async (projectId: string, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    await projectService.deleteProject(projectId, token);
    return projectId; // Return ID to remove from state
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to delete project');
  }
});


const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject(state, action: PayloadAction<Project | null>) {
      state.currentProject = action.payload;
      state.projectMembers = []; // Clear members when project changes
      state.membersError = null; // Clear member errors
    },
    clearProjectsError(state) {
      state.error = null;
    },
    clearMembersError(state) {
        state.membersError = null;
    }
  },
  extraReducers: (builder) => {
    // --- Projects Thunks ---
    builder.addCase(fetchProjects.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => { state.loading = 'succeeded'; state.projects = action.payload; });
    builder.addCase(fetchProjects.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(createProject.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => { state.loading = 'succeeded'; state.projects.push(action.payload); });
    builder.addCase(createProject.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(fetchProjectById.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(fetchProjectById.fulfilled, (state, action: PayloadAction<Project>) => { state.loading = 'succeeded'; state.currentProject = action.payload; });
    builder.addCase(fetchProjectById.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(updateProject.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = 'succeeded';
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?.id === action.payload.id) state.currentProject = action.payload;
    });
    builder.addCase(updateProject.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(deleteProject.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = 'succeeded';
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
            state.currentProject = null;
            state.projectMembers = []; // Clear members if current project is deleted
        }
    });
    builder.addCase(deleteProject.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    // --- Project Members Thunks ---
    builder.addCase(fetchProjectMembers.pending, (state) => { state.membersLoading = 'pending'; state.membersError = null; });
    builder.addCase(fetchProjectMembers.fulfilled, (state, action: PayloadAction<ProjectMember[]>) => { state.membersLoading = 'succeeded'; state.projectMembers = action.payload; });
    builder.addCase(fetchProjectMembers.rejected, (state, action) => { state.membersLoading = 'failed'; state.membersError = action.payload as string; });

    builder.addCase(addProjectMember.pending, (state) => { state.membersLoading = 'pending'; state.membersError = null; });
    builder.addCase(addProjectMember.fulfilled, (state, action: PayloadAction<ProjectMember>) => {
        state.membersLoading = 'succeeded';
        state.projectMembers.push(action.payload);
    });
    builder.addCase(addProjectMember.rejected, (state, action) => { state.membersLoading = 'failed'; state.membersError = action.payload as string; });

    builder.addCase(updateProjectMemberRole.pending, (state) => { state.membersLoading = 'pending'; state.membersError = null; });
    builder.addCase(updateProjectMemberRole.fulfilled, (state, action: PayloadAction<ProjectMember>) => {
        state.membersLoading = 'succeeded';
        const index = state.projectMembers.findIndex(m => m.user_id === action.payload.user_id && m.project_id === action.payload.project_id);
        if (index !== -1) state.projectMembers[index] = action.payload;
    });
    builder.addCase(updateProjectMemberRole.rejected, (state, action) => { state.membersLoading = 'failed'; state.membersError = action.payload as string; });

    builder.addCase(removeProjectMember.pending, (state) => { state.membersLoading = 'pending'; state.membersError = null; });
    builder.addCase(removeProjectMember.fulfilled, (state, action: PayloadAction<{ projectId: string; userId: string }>) => {
        state.membersLoading = 'succeeded';
        state.projectMembers = state.projectMembers.filter(m => !(m.user_id === action.payload.userId && m.project_id === action.payload.projectId));
    });
    builder.addCase(removeProjectMember.rejected, (state, action) => { state.membersLoading = 'failed'; state.membersError = action.payload as string; });
  },
});

// Actions
export const { setCurrentProject, clearProjectsError, clearMembersError } = projectSlice.actions;

// Selectors for Projects
export const selectAllProjects = (state: RootState) => state.projects.projects;
export const selectCurrentProject = (state: RootState) => state.projects.currentProject;
export const selectProjectsLoading = (state: RootState) => state.projects.loading;
export const selectProjectsError = (state: RootState) => state.projects.error;

// Selectors for Project Members
export const selectProjectMembers = (state: RootState) => state.projects.projectMembers;
export const selectProjectMembersLoading = (state: RootState) => state.projects.membersLoading;
export const selectProjectMembersError = (state: RootState) => state.projects.membersError;

export default projectSlice.reducer;


// --- Async Thunks for Project Members ---
export const fetchProjectMembers = createAsyncThunk('projects/fetchProjectMembers', async (projectId: string, { getState, rejectWithValue }) => {
    try {
        const token = (getState() as RootState).auth.token;
        return await projectService.getProjectMembers(projectId, token);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Failed to fetch project members');
    }
});

export const addProjectMember = createAsyncThunk('projects/addProjectMember', async (data: { projectId: string; email: string; role: 'editor' | 'viewer' }, { getState, rejectWithValue }) => {
    try {
        const token = (getState() as RootState).auth.token;
        return await projectService.addProjectMember(data.projectId, data.email, data.role, token);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Failed to add project member');
    }
});

export const updateProjectMemberRole = createAsyncThunk('projects/updateProjectMemberRole', async (data: { projectId: string; userId: string; role: 'editor' | 'viewer' }, { getState, rejectWithValue }) => {
    try {
        const token = (getState() as RootState).auth.token;
        return await projectService.updateProjectMemberRole(data.projectId, data.userId, data.role, token);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Failed to update member role');
    }
});

export const removeProjectMember = createAsyncThunk('projects/removeProjectMember', async (data: { projectId: string; userId: string }, { getState, rejectWithValue }) => {
    try {
        const token = (getState() as RootState).auth.token;
        await projectService.removeProjectMember(data.projectId, data.userId, token);
        return data; // Return identifiers for removal from state
    } catch (error: any) {
        return rejectWithValue(error.message || 'Failed to remove project member');
    }
});
