import { Task, TaskFilters, TaskSorting } from './taskSlice'; // Import filter/sort types

const API_URL_BASE = '/api/tasks/';
const API_URL_PROJECT_TASKS = (projectId: string) => `/api/tasks/project/${projectId}`;

const getAuthHeaders = (token: string | null) => {
  if (!token) {
    throw new Error('No token provided for authenticated request');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get all tasks for a specific project, now with filtering and sorting
const getTasksByProjectId = async (
    projectId: string,
    token: string | null,
    filters?: TaskFilters,
    sorting?: TaskSorting
  ): Promise<Task[]> => {

  const params = new URLSearchParams();
  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignee_id) params.append('assignee_id', filters.assignee_id);
    if (filters.due_date_before) params.append('due_date_before', filters.due_date_before);
    if (filters.due_date_after) params.append('due_date_after', filters.due_date_after);
  }
  if (sorting) {
    if (sorting.sortBy) params.append('sortBy', sorting.sortBy);
    if (sorting.sortOrder) params.append('sortOrder', sorting.sortOrder);
  }

  const queryString = params.toString();
  const url = `${API_URL_PROJECT_TASKS(projectId)}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch tasks and parse error' }));
    throw new Error(errorData.message || `Failed to fetch tasks for project ${projectId}`);
  }
  return response.json();
};

// Create a new task
const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by_id'>, token: string | null): Promise<Task> => {
  const response = await fetch(API_URL_BASE, { // POST to base URL for tasks
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create task and parse error' }));
    throw new Error(errorData.message || 'Failed to create task');
  }
  return response.json();
};

// Get a specific task by its ID
const getTaskById = async (taskId: string, token: string | null): Promise<Task> => {
  const response = await fetch(API_URL_BASE + taskId, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch task and parse error' }));
    throw new Error(errorData.message || `Failed to fetch task ${taskId}`);
  }
  return response.json();
};

// Update an existing task
const updateTask = async (taskId: string, taskData: Partial<Task>, token: string | null): Promise<Task> => {
  const response = await fetch(API_URL_BASE + taskId, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update task and parse error' }));
    throw new Error(errorData.message || `Failed to update task ${taskId}`);
  }
  return response.json();
};

// Delete a task
const deleteTask = async (taskId: string, token: string | null): Promise<void> => {
  const response = await fetch(API_URL_BASE + taskId, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
     // For 204 No Content, response.json() will fail.
    if (response.status === 204) return;
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete task and parse error' }));
    throw new Error(errorData.message || `Failed to delete task ${taskId}`);
  }
};

const taskService = {
  getTasksByProjectId,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
};

export default taskService;
