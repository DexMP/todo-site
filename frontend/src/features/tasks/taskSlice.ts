import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store'; // Adjust path as necessary
import taskService from './taskService'; // To be created

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string; // Assuming ISO string
  project_id: string;
  assignee_id?: string;
  created_by_id: string;
  created_at: string; // Assuming ISO string
  updated_at: string; // Assuming ISO string
}

export interface TaskFilters {
  status?: Task['status'] | null;
  priority?: Task['priority'] | null;
  assignee_id?: string | null;
  due_date_before?: string | null; // ISO date string
  due_date_after?: string | null;  // ISO date string
}

export interface TaskSorting {
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt' | string; // Allow string for flexibility or custom backend fields
  sortOrder: 'asc' | 'desc';
}
interface TaskState {
  tasksByProject: { [projectId: string]: Task[] };
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null | undefined;
  filters: TaskFilters;
  sorting: TaskSorting;
}

const initialState: TaskState = {
  tasksByProject: {},
  loading: 'idle',
  error: null,
  filters: {
    status: null,
    priority: null,
    assignee_id: null,
    due_date_before: null,
    due_date_after: null,
  },
  sorting: {
    sortBy: 'createdAt', // Default sort
    sortOrder: 'desc',
  },
};

// Async Thunks
export const fetchTasksByProject = createAsyncThunk('tasks/fetchTasksByProject', async (projectId: string, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    const { filters, sorting } = (getState() as RootState).tasks; // Get current filters/sorting from state
    return { projectId, tasks: await taskService.getTasksByProjectId(projectId, token, filters, sorting) };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/createTask', async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by_id'>, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await taskService.createTask(taskData, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/updateTask', async (taskData: Task, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    return await taskService.updateTask(taskData.id, taskData, token);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to update task');
  }
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (taskIdentifiers: { projectId: string; taskId: string }, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as RootState).auth.token;
    await taskService.deleteTask(taskIdentifiers.taskId, token);
    return taskIdentifiers; // Return identifiers to remove from state
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to delete task');
  }
});


const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state) {
        state.error = null;
    },
    setTaskFilters(state, action: PayloadAction<Partial<TaskFilters>>) {
        state.filters = { ...state.filters, ...action.payload };
        // Note: Fetching tasks after filter change should be dispatched by the component
    },
    clearTaskFilters(state) {
        state.filters = initialState.filters;
    },
    setTaskSorting(state, action: PayloadAction<Partial<TaskSorting>>) {
        state.sorting = { ...state.sorting, ...action.payload };
        // Note: Fetching tasks after sort change should be dispatched by the component
    },
    // Reducer to optimistically update task status (e.g., for drag and drop)
    updateTaskStatusOptimistic(state, action: PayloadAction<{ projectId: string, taskId: string, newStatus: Task['status'] }>) {
        const { projectId, taskId, newStatus } = action.payload;
        const tasks = state.tasksByProject[projectId];
        if (tasks) {
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].status = newStatus;
            }
        }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTasksByProject.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(fetchTasksByProject.fulfilled, (state, action: PayloadAction<{ projectId: string; tasks: Task[] }>) => {
      state.loading = 'succeeded';
      state.tasksByProject[action.payload.projectId] = action.payload.tasks;
    });
    builder.addCase(fetchTasksByProject.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(createTask.pending, (state) => { state.loading = 'pending'; state.error = null; });
    builder.addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
      state.loading = 'succeeded';
      const { project_id } = action.payload;
      if (!state.tasksByProject[project_id]) state.tasksByProject[project_id] = [];
      state.tasksByProject[project_id].push(action.payload);
      // Potentially re-sort or re-filter if needed, or rely on next fetch for consistency
    });
    builder.addCase(createTask.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });

    builder.addCase(updateTask.pending, (state) => { /* Manage specific task loading if needed */ });
    builder.addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = 'succeeded';
        const { project_id, id } = action.payload;
        const tasksInProject = state.tasksByProject[project_id];
        if (tasksInProject) {
            const index = tasksInProject.findIndex(t => t.id === id);
            if (index !== -1) tasksInProject[index] = action.payload;
        }
        // Potentially re-sort or re-filter if needed
    });
    builder.addCase(updateTask.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; /* Revert optimistic if needed */ });

    builder.addCase(deleteTask.pending, (state) => { /* Manage specific task loading if needed */ });
    builder.addCase(deleteTask.fulfilled, (state, action: PayloadAction<{ projectId: string; taskId: string }>) => {
        state.loading = 'succeeded';
        const { projectId, taskId } = action.payload;
        if (state.tasksByProject[projectId]) {
            state.tasksByProject[projectId] = state.tasksByProject[projectId].filter(t => t.id !== taskId);
        }
    });
    builder.addCase(deleteTask.rejected, (state, action) => { state.loading = 'failed'; state.error = action.payload as string; });
  },
});

export const { clearTasksError, updateTaskStatusOptimistic, setTaskFilters, clearTaskFilters, setTaskSorting } = taskSlice.actions;

export const selectTasksByProjectId = (state: RootState, projectId: string) => state.tasks.tasksByProject[projectId] || [];
export const selectTasksLoading = (state: RootState) => state.tasks.loading;
export const selectTasksError = (state: RootState) => state.tasks.error;
export const selectTaskFilters = (state: RootState) => state.tasks.filters;
export const selectTaskSorting = (state: RootState) => state.tasks.sorting;

export default taskSlice.reducer;
