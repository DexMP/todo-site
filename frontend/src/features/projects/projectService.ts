import { Project, ProjectMember } from './projectSlice'; // Assuming Project & ProjectMember interface is exported from slice

const API_URL = '/api/projects/';

const getAuthHeaders = (token: string | null) => {
  if (!token) {
    // This case should ideally be handled before calling the service,
    // e.g., by checking isAuthenticated in the component or thunk.
    throw new Error('No token provided for authenticated request');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const getProjects = async (token: string | null): Promise<Project[]> => {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch projects and parse error' }));
    throw new Error(errorData.message || 'Failed to fetch projects');
  }
  return response.json();
};

const createProject = async (projectData: { name: string; description?: string }, token: string | null): Promise<Project> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create project and parse error' }));
    throw new Error(errorData.message || 'Failed to create project');
  }
  return response.json();
};

const getProjectById = async (projectId: string, token: string | null): Promise<Project> => {
  const response = await fetch(API_URL + projectId, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project and parse error' }));
    throw new Error(errorData.message || `Failed to fetch project ${projectId}`);
  }
  return response.json();
};

const updateProject = async (projectId: string, projectData: Partial<Project>, token: string | null): Promise<Project> => {
  const response = await fetch(API_URL + projectId, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(projectData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update project and parse error' }));
    throw new Error(errorData.message || `Failed to update project ${projectId}`);
  }
  return response.json();
};

const deleteProject = async (projectId: string, token: string | null): Promise<void> => {
  const response = await fetch(API_URL + projectId, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    // For 204 No Content, response.json() will fail.
    if (response.status === 204) return;
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete project and parse error' }));
    throw new Error(errorData.message || `Failed to delete project ${projectId}`);
  }
  // Expecting 204 No Content for successful DELETE
};

const projectService = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  // Member functions
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
};

export default projectService;


// --- Project Member API Calls ---
async function getProjectMembers(projectId: string, token: string | null): Promise<ProjectMember[]> {
  const response = await fetch(`${API_URL}${projectId}/members`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch members' }));
    throw new Error(errorData.message);
  }
  return response.json();
}

async function addProjectMember(projectId: string, email: string, role: 'editor' | 'viewer', token: string | null): Promise<ProjectMember> {
  const response = await fetch(`${API_URL}${projectId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to add member' }));
    throw new Error(errorData.message);
  }
  return response.json();
}

async function updateProjectMemberRole(projectId: string, userId: string, role: 'editor' | 'viewer', token: string | null): Promise<ProjectMember> {
  const response = await fetch(`${API_URL}${projectId}/members/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update role' }));
    throw new Error(errorData.message);
  }
  return response.json();
}

async function removeProjectMember(projectId: string, userId: string, token: string | null): Promise<void> {
  const response = await fetch(`${API_URL}${projectId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!response.ok && response.status !== 204) { // Allow 204 No Content
    const errorData = await response.json().catch(() => ({ message: 'Failed to remove member' }));
    throw new Error(errorData.message);
  }
}
