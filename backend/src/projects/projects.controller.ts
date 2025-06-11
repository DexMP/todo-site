import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware'; // Adjust path as needed

import {
  _injectProjectsDB_for_tasks,
  _clearTasksForProject_for_projects,
  _getProjectsDB_for_projects,
  // _getTasksDB_for_projects
} from '../tasks/tasks.controller';
import { usersDB } from '../auth/auth.controller';
import { io } from '../index'; // Import Socket.IO instance

// --- Project Member Types and DB ---
export interface ProjectMember {
  user_id: string; // Corresponds to User.id
  project_id: string;
  role: 'owner' | 'editor' | 'viewer'; // Owner is implicit via Project.owner_id
  username?: string; // For convenience, denormalized
  email?: string; // For convenience, denormalized
}
// projectMembersDB: Stores explicit memberships (owner is implicitly a member with 'owner' role)
let projectMembersDB: ProjectMember[] = [];


// In-memory store for projects - now managed via tasks.controller shared functions
interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  team_id?: string;
  created_at: Date;
  updated_at: Date;
}
// let projectsDB: Project[] = []; // Replaced by shared version
let projectIdCounter = 1; // This can remain local or be managed if IDs need global uniqueness across restarts

// Initialize projectsDB for this controller and share it with tasks controller
let projectsDB = _getProjectsDB_for_projects(); // Gets the shared projects array
_injectProjectsDB_for_tasks(projectsDB); // Shares it with the tasks controller


// --- Authorization Helper Functions ---
const isProjectOwner = (project: Project, userId: string): boolean => {
  return project.owner_id === userId;
};

const getProjectMembership = (projectId: string, userId: string): ProjectMember | undefined => {
  // Owner is implicitly an owner
  const project = projectsDB.find(p => p.id === projectId);
  if (project && project.owner_id === userId) {
    const ownerUser = usersDB.find(u => u.id.toString() === userId.toString());
    return { project_id: projectId, user_id: userId, role: 'owner', username: ownerUser?.username, email: ownerUser?.email };
  }
  return projectMembersDB.find(m => m.project_id === projectId && m.user_id === userId);
};

const canManageProjectMembers = (project: Project, userId: string): boolean => {
  return isProjectOwner(project, userId); // Only owners can manage members for now
};

const canEditProjectContent = (project: Project, userId: string): boolean => {
  const membership = getProjectMembership(project.id, userId);
  return membership?.role === 'owner' || membership?.role === 'editor';
};

const canViewProject = (project: Project, userId: string): boolean => {
  return !!getProjectMembership(project.id, userId); // Any member (including owner) can view
};


export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, team_id } = req.body;
    const userId = req.user?.userId;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const newProject: Project = {
      id: `project_${projectIdCounter++}`,
      name,
      description,
      owner_id: userId, // owner_id is the creator
      team_id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    projectsDB.push(newProject);
    // Owner is implicitly a member, no need to add to projectMembersDB as 'owner' explicitly
    // unless your model requires all members to be in projectMembersDB.
    // For simplicity here, owner_id on project is enough to denote ownership.
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    // Return projects where the user is owner OR a member in projectMembersDB
    const ownedProjects = projectsDB.filter(p => p.owner_id === userId);
    const memberProjectIds = projectMembersDB.filter(m => m.user_id === userId).map(m => m.project_id);
    const memberProjects = projectsDB.filter(p => memberProjectIds.includes(p.id));

    const allUserProjects = [...ownedProjects, ...memberProjects.filter(p => !ownedProjects.find(op => op.id === p.id))];
    res.status(200).json(allUserProjects);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;
    const project = projectsDB.find(p => p.id === projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!userId || !canViewProject(project, userId)) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { name, description, team_id } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const projectIndex = projectsDB.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectToUpdate = projectsDB[projectIndex];
    if (!canEditProjectContent(projectToUpdate, userId)) { // Owners or editors can update
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const updatedProject = {
      ...projectToUpdate,
      name: name ?? project.name,
      description: description ?? project.description,
      team_id: team_id ?? project.team_id,
      updated_at: new Date(),
    };
    projectsDB[projectIndex] = updatedProject;
    res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const projectIndex = projectsDB.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isProjectOwner(projectsDB[projectIndex], userId)) { // Only owners can delete
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    projectsDB.splice(projectIndex, 1);
    // Also remove associated project members and tasks
    projectMembersDB = projectMembersDB.filter(m => m.project_id !== projectId);
    _clearTasksForProject_for_projects(projectId);
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

// --- Project Member Endpoints ---

export const addProjectMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body; // role: 'editor' or 'viewer'
    const invitingUserId = req.user?.userId;

    if (!invitingUserId) return res.status(401).json({ message: 'User not authenticated' });
    if (!email || !role) return res.status(400).json({ message: 'User email and role are required' });
    if (role === 'owner') return res.status(400).json({ message: 'Cannot assign owner role directly' });


    const project = projectsDB.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!canManageProjectMembers(project, invitingUserId)) {
      return res.status(403).json({ message: 'Not authorized to add members to this project' });
    }

    const userToAdd = usersDB.find(u => u.email === email);
    if (!userToAdd) return res.status(404).json({ message: 'User to add not found by email' });
    if (userToAdd.id.toString() === project.owner_id.toString()) return res.status(400).json({ message: 'User is already the project owner' });


    const existingMembership = projectMembersDB.find(m => m.project_id === projectId && m.user_id === userToAdd.id.toString());
    if (existingMembership) {
      return res.status(409).json({ message: 'User is already a member of this project' });
    }

    const newMember: ProjectMember = {
      project_id: projectId,
      user_id: userToAdd.id.toString(),
      role,
      username: userToAdd.username,
      email: userToAdd.email,
    };
    projectMembersDB.push(newMember);

    // Emit event to project room
    io.to(`project:${projectId}`).emit('member_added', { projectId, member: newMember });

    // Concept: Notify the added user directly if they are online
    // This requires a mapping of userId to socketId(s) or a personal user room.
    // For simplicity, we'll rely on the user re-joining rooms or getting updates via project room.
    // Example: io.to(`user:${userToAdd.id}`).emit('added_to_project', { projectId, projectName: project.name });


    res.status(201).json(newMember);
  } catch (error) {
    next(error);
  }
};

export const getProjectMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const requestingUserId = req.user?.userId;
    const project = projectsDB.find(p => p.id === projectId);

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!requestingUserId || !canViewProject(project, requestingUserId)) {
      return res.status(403).json({ message: 'Not authorized to view members of this project' });
    }

    const ownerUser = usersDB.find(u => u.id.toString() === project.owner_id.toString());
    const ownerMember: ProjectMember = {
        project_id: projectId,
        user_id: project.owner_id,
        role: 'owner',
        username: ownerUser?.username,
        email: ownerUser?.email,
    };
    const explicitMembers = projectMembersDB.filter(m => m.project_id === projectId);
    res.status(200).json([ownerMember, ...explicitMembers]);
  } catch (error) {
    next(error);
  }
};

export const updateProjectMemberRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, userId: memberUserIdToUpdate } = req.params;
    const { role } = req.body; // new role: 'editor' or 'viewer'
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) return res.status(401).json({ message: 'User not authenticated' });
    if (!role) return res.status(400).json({ message: 'Role is required' });
    if (role === 'owner') return res.status(400).json({ message: 'Cannot change role to owner' });


    const project = projectsDB.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!canManageProjectMembers(project, requestingUserId)) {
      return res.status(403).json({ message: 'Not authorized to update members in this project' });
    }
    if (memberUserIdToUpdate === project.owner_id) {
        return res.status(400).json({ message: "Project owner's role cannot be changed this way" });
    }

    const memberIndex = projectMembersDB.findIndex(m => m.project_id === projectId && m.user_id === memberUserIdToUpdate);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this project' });
    }

    projectMembersDB[memberIndex].role = role;
    projectMembersDB[memberIndex].username = usersDB.find(u => u.id.toString() === memberUserIdToUpdate)?.username; // keep denormalized data fresh
    projectMembersDB[memberIndex].email = usersDB.find(u => u.id.toString() === memberUserIdToUpdate)?.email;

    const updatedMember = projectMembersDB[memberIndex];
    io.to(`project:${projectId}`).emit('member_role_updated', { projectId, member: updatedMember });

    res.status(200).json(updatedMember);
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, userId: memberUserIdToRemove } = req.params;
    const requestingUserId = req.user?.userId;

    if (!requestingUserId) return res.status(401).json({ message: 'User not authenticated' });

    const project = projectsDB.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!canManageProjectMembers(project, requestingUserId)) {
      return res.status(403).json({ message: 'Not authorized to remove members from this project' });
    }
    if (memberUserIdToRemove === project.owner_id) {
        return res.status(400).json({ message: "Project owner cannot be removed this way" });
    }

    const initialLength = projectMembersDB.length;
    projectMembersDB = projectMembersDB.filter(m => !(m.project_id === projectId && m.user_id === memberUserIdToRemove));

    if (projectMembersDB.length === initialLength) {
      return res.status(404).json({ message: 'Member not found or already removed' });
    }
    // Also unassign tasks from this user for this project
    const { _unassignTasksFromUser_for_projects } = require('../tasks/tasks.controller');
    _unassignTasksFromUser_for_projects(projectId, memberUserIdToRemove);

    io.to(`project:${projectId}`).emit('member_removed', { projectId, userId: memberUserIdToRemove });

    // Concept: Make the removed user's socket leave the project room if they are online
    // This needs a way to find socket(s) for memberUserIdToRemove.
    // Example:
    // const userSockets = findSocketsForUser(memberUserIdToRemove);
    // userSockets.forEach(socket => socket.leave(`project:${projectId}`));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Make projectMembersDB accessible for task controller (for assignee validation)
export const _getProjectMembersDB_for_tasks = () => projectMembersDB;


// Placeholder for conceptual Celery/RabbitMQ integration
import { sendEmail } from '../utils/mail'; // Assuming mail utility

export const inviteUserByEmailToProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    const { email: userToInviteEmail, role } = req.body;
    const invitingUserId = req.user?.userId;

    if (!invitingUserId) return res.status(401).json({ message: 'User not authenticated' });

    const project = projectsDB.find(p => p.id === projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectOwner(project, invitingUserId)) { // Simplified: only owner can invite
        return res.status(403).json({ message: 'Not authorized to invite members to this project' });
    }

    const userToInvite = usersDB.find(u => u.email === userToInviteEmail);
    if (!userToInvite) {
        // If user doesn't exist, you might send an invitation email to sign up
        await sendEmail({
            to: userToInviteEmail,
            subject: `You're invited to join project ${project.name}!`,
            text: `Hello! You've been invited to join the project "${project.name}" by ${req.user?.email}. Please sign up to access the project.`,
            // html: `<p>...</p>`
        });
        return res.status(200).json({ message: `Invitation email sent to ${userToInviteEmail}. They need to sign up first.` });
    }

    // If user exists, proceed to add them as a member (similar to addProjectMember)
    if (userToInvite.id.toString() === project.owner_id.toString()) return res.status(400).json({ message: 'User is already the project owner' });
    const existingMembership = projectMembersDB.find(m => m.project_id === projectId && m.user_id === userToInvite.id.toString());
    if (existingMembership) return res.status(409).json({ message: 'User is already a member of this project' });

    const newMember: ProjectMember = {
      project_id: projectId,
      user_id: userToInvite.id.toString(),
      role: role || 'viewer', // Default role if not provided
      username: userToInvite.username,
      email: userToInvite.email,
    };
    projectMembersDB.push(newMember);
    io.to(`project:${projectId}`).emit('member_added', { projectId, member: newMember });

    // Send email to existing user
     await sendEmail({
        to: userToInviteEmail,
        subject: `You've been added to project ${project.name}`,
        text: `Hello ${userToInvite.username || ''}! You've been added to the project "${project.name}" with the role "${newMember.role}" by ${req.user?.email}.`,
    });

    res.status(201).json({ message: 'User added to project and notified.', member: newMember });
};
