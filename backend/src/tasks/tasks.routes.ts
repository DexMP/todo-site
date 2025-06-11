import { Router } from 'express';
import { protect } from '../auth/auth.middleware'; // Adjust path as needed
import {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTask,
  deleteTask
} from './tasks.controller';

const router = Router();

// All task routes are protected
router.use(protect);

// Create a task (typically associated with a project)
router.post('/', createTask);

// Get all tasks for a specific project
router.get('/project/:projectId', getTasksByProject);

// Get, Update, Delete a specific task by its ID
router.get('/:taskId', getTaskById);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

export default router;
