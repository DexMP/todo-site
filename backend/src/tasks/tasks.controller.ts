import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { usersDB } from '../auth/auth.controller';
import { _getProjectMembersDB_for_tasks, ProjectMember } from '../projects/projects.controller';
import { io } from '../index'; // Import Socket.IO instance
import { sendEmail } from '../utils/mail'; // For mocked email sending (reminders)

// In-memory store for tasks & projects (projectsDB for reference)
interface Project { // Simplified Project interface for tasks context
  id: string;
  name: string;
  owner_id: string;
}
let projectsDB: Project[] = []; // Populated by _injectProjectsDB_for_tasks

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: Date;
  project_id: string;
  assignee_id?: string;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
}
let tasksDB: Task[] = [];
let taskIdCounter = 1;

// --- Authorization Helper Functions for Tasks ---
const getProjectMembershipForTaskAuth = (projectId: string, userId: string): ProjectMember | undefined => {
  const project = projectsDB.find(p => p.id === projectId);
  if (!project) return undefined;
  if (project.owner_id === userId) {
    const ownerUser = usersDB.find(u => u.id.toString() === userId.toString());
    return { project_id: projectId, user_id: userId, role: 'owner', username: ownerUser?.username, email: ownerUser?.email };
  }
  const projectMembers = _getProjectMembersDB_for_tasks();
  return projectMembers.find(m => m.project_id === projectId && m.user_id === userId);
};

const canViewTasksInProject = (projectId: string, userId: string): boolean => {
  return !!getProjectMembershipForTaskAuth(projectId, userId); // Any project member can view tasks
};

const canCreateEditTasksInProject = (projectId: string, userId: string): boolean => {
  const membership = getProjectMembershipForTaskAuth(projectId, userId);
  return membership?.role === 'owner' || membership?.role === 'editor';
};

const isUserProjectMember = (projectId: string, userId: string): boolean => {
    // Check if userId is owner or in the explicit members list for the project
    const project = projectsDB.find(p => p.id === projectId);
    if (project && project.owner_id === userId) return true;

    const projectMembers = _getProjectMembersDB_for_tasks();
    return projectMembers.some(m => m.project_id === projectId && m.user_id === userId);
};


export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, status = 'todo', priority = 'medium', due_date, project_id, assignee_id } = req.body;
    const created_by_id = req.user?.userId;

    if (!title || !project_id) return res.status(400).json({ message: 'Task title and project_id are required' });
    if (!created_by_id) return res.status(401).json({ message: 'User not authenticated' });

    if (!canCreateEditTasksInProject(project_id, created_by_id)) {
      return res.status(403).json({ message: 'Not authorized to create tasks for this project' });
    }
    if (assignee_id && !isUserProjectMember(project_id, assignee_id)) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    const newTask: Task = {
      id: `task_${taskIdCounter++}`,
      title,
      description,
      status,
      priority,
      due_date: due_date ? new Date(due_date) : undefined,
      project_id,
      assignee_id,
      created_by_id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    tasksDB.push(newTask);

    // Emit event
    io.to(`project:${project_id}`).emit('task_created', { projectId: project_id, task: newTask });

    // Conceptual: Schedule reminder if due_date is present
    if (newTask.due_date) {
        const assigneeUser = usersDB.find(u => u.id.toString() === newTask.assignee_id?.toString());
        if (assigneeUser) {
            scheduleReminder(newTask.id, newTask.due_date, assigneeUser.email, newTask.title, project_id);
        }
    }

    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

export const getTasksByProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;
    const { status, priority, assignee_id, due_date_before, due_date_after, sortBy, sortOrder = 'asc' } = req.query;

    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    if (!canViewTasksInProject(projectId, userId)) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    let projectTasks = tasksDB.filter(task => task.project_id === projectId);

    // Filtering
    if (status) {
      projectTasks = projectTasks.filter(task => task.status === status);
    }
    if (priority) {
      projectTasks = projectTasks.filter(task => task.priority === priority);
    }
    if (assignee_id) {
      projectTasks = projectTasks.filter(task => task.assignee_id === assignee_id);
    }
    if (due_date_before && !isNaN(new Date(due_date_before as string).getTime())) {
      projectTasks = projectTasks.filter(task => task.due_date && new Date(task.due_date) < new Date(due_date_before as string));
    }
    if (due_date_after && !isNaN(new Date(due_date_after as string).getTime())) {
      projectTasks = projectTasks.filter(task => task.due_date && new Date(task.due_date) > new Date(due_date_after as string));
    }

    // Sorting
    if (sortBy) {
      projectTasks.sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortBy) {
            case 'dueDate':
                valA = a.due_date ? new Date(a.due_date).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
                valB = b.due_date ? new Date(b.due_date).getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
                break;
            case 'priority': // Assuming 'high' > 'medium' > 'low'
                const priorityOrder = { low: 1, medium: 2, high: 3 };
                valA = priorityOrder[a.priority] || 0;
                valB = priorityOrder[b.priority] || 0;
                break;
            case 'title':
                valA = a.title.toLowerCase();
                valB = b.title.toLowerCase();
                break;
            case 'createdAt':
                valA = new Date(a.created_at).getTime();
                valB = new Date(b.created_at).getTime();
                break;
            default: // Default to no specific sort if sortBy is unrecognized
                return 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    res.status(200).json(projectTasks);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    const task = tasksDB.find(t => t.id === taskId);

    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!userId || !canViewTasksInProject(task.project_id, userId)) { // Check view permission for the task's project
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, due_date, assignee_id } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const taskIndex = tasksDB.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

    const taskToUpdate = tasksDB[taskIndex];
    if (!canCreateEditTasksInProject(taskToUpdate.project_id, userId)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    if (assignee_id && !isUserProjectMember(taskToUpdate.project_id, assignee_id)) {
        return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }


    const updatedTask = {
      ...taskToUpdate,
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      due_date: due_date ? new Date(due_date) : task.due_date,
      assignee_id: assignee_id !== undefined ? assignee_id : task.assignee_id, // Allow unassigning
      updated_at: new Date(),
    };
    tasksDB[taskIndex] = updatedTask;

    // Emit event
    io.to(`project:${updatedTask.project_id}`).emit('task_updated', { projectId: updatedTask.project_id, task: updatedTask });

    // Conceptual: Reschedule or cancel reminder if due_date/assignee changed
    // This would require more complex logic to manage existing Celery tasks.
    // For now, if due date exists on update, schedule a new one (could lead to multiple reminders).
    if (updatedTask.due_date) {
        const assigneeUser = usersDB.find(u => u.id.toString() === updatedTask.assignee_id?.toString());
        if (assigneeUser) {
            scheduleReminder(updatedTask.id, updatedTask.due_date, assigneeUser.email, updatedTask.title, updatedTask.project_id);
        }
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const taskIndex = tasksDB.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

    const taskToDelete = tasksDB[taskIndex];
    if (!canCreateEditTasksInProject(taskToDelete.project_id, userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    tasksDB.splice(taskIndex, 1);

    // Emit event
    io.to(`project:${taskToDelete.project_id}`).emit('task_deleted', { projectId: taskToDelete.project_id, taskId: taskToDelete.id });

    // Conceptual: Cancel any scheduled reminders for this task
    // cancelReminder(taskToDelete.id);


    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// This is a hack for the in-memory example to work across controllers.
// In a real setup, project data would be fetched from a database.
export const _injectProjectsDB_for_tasks = (projects: any[]) => {
    projectsDB = projects;
};
// Similarly, to make project deletion cascade to tasks in this in-memory example:
export const _clearTasksForProject_for_projects = (projectId: string) => {
    tasksDB = tasksDB.filter(task => task.project_id !== projectId);
};

// Called when a user is removed from a project to unassign their tasks
export const _unassignTasksFromUser_for_projects = (projectId: string, userId: string) => {
    tasksDB = tasksDB.map(task => {
        if (task.project_id === projectId && task.assignee_id === userId) {
            return { ...task, assignee_id: undefined }; // Or null, depending on preference
        }
        return task;
    });
};

// And to make projectsDB accessible from projects.controller (already exists)
export const _getProjectsDB_for_projects = () => projectsDB;
// tasksDB is not directly exposed, but managed via these functions for project controller interactions
// export const _getTasksDB_for_projects = () => tasksDB; // Not strictly needed by project controller if using specific functions like above
