import { Router } from 'express';
import { protect } from '../auth/auth.middleware'; // Adjust path as needed
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,      // Added
  getProjectMembers,
  updateProjectMemberRole,
  removeProjectMember,
  inviteUserByEmailToProject // Added
} from './projects.controller';

const router = Router();

// All project routes are protected
router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

// Project Member Routes
router.post('/:projectId/members', addProjectMember); // Generic add, assumes user exists
router.post('/:projectId/invite', inviteUserByEmailToProject); // Specific for email invitation
router.get('/:projectId/members', getProjectMembers);
router.put('/:projectId/members/:userId', updateProjectMemberRole);
router.delete('/:projectId/members/:userId', removeProjectMember);

export default router;
