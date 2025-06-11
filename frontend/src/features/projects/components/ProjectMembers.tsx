import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import {
  fetchProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  selectProjectMembers,
  selectProjectMembersLoading,
  selectProjectMembersError,
  clearMembersError,
  ProjectMember,
} from '../projectSlice';
import { selectCurrentProject } from '../projectSlice';
import { selectUser } from '../../auth/authSlice'; // To get current user's ID for role checking

const ProjectMembers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector(selectCurrentProject);
  const members = useSelector(selectProjectMembers);
  const isLoading = useSelector(selectProjectMembersLoading) === 'pending';
  const error = useSelector(selectProjectMembersError);
  const currentUser = useSelector(selectUser); // Get the currently logged-in user

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  useEffect(() => {
    if (currentProject) {
      dispatch(fetchProjectMembers(currentProject.id));
    }
    return () => { // Cleanup errors when component unmounts or project changes
        dispatch(clearMembersError());
    };
  }, [dispatch, currentProject]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !inviteEmail.trim()) return;
    dispatch(addProjectMember({ projectId: currentProject.id, email: inviteEmail, role: inviteRole }))
      .unwrap()
      .then(() => {
        setInviteEmail('');
        setInviteRole('viewer');
        alert('Member added successfully');
      })
      .catch(err => alert(`Failed to add member: ${err}`)); // Error is also in Redux state
  };

  const handleUpdateRole = (memberId: string, newRole: 'editor' | 'viewer') => {
    if (!currentProject) return;
    dispatch(updateProjectMemberRole({ projectId: currentProject.id, userId: memberId, role: newRole }))
      .unwrap()
      .catch(err => alert(`Failed to update role: ${err}`));
  };

  const handleRemoveMember = (memberId: string) => {
    if (!currentProject || !window.confirm('Are you sure you want to remove this member?')) return;
    dispatch(removeProjectMember({ projectId: currentProject.id, userId: memberId }))
      .unwrap()
      .catch(err => alert(`Failed to remove member: ${err}`));
  };

  // Determine if the current user is the project owner
  const isCurrentUserOwner = currentProject && currentUser && currentProject.owner_id === currentUser.id;

  if (!currentProject) {
    return <p className="text-text-secondary p-4 text-center">Select a project to manage its members.</p>;
  }
  if (isLoading && members.length === 0) {
    return <p className="text-text-secondary p-4">Loading project members...</p>;
  }
  // Error display could be more prominent if needed
  if (error && !isLoading) { // Show error only if not loading, to prevent flicker
    return <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-3 rounded mt-4">Error: {error}</p>;
  }

  return (
    <div className="mt-6 p-4 bg-card-background rounded-lg shadow border border-border-color">
      <h4 className="text-lg font-semibold text-text-primary mb-4">
        Members of <span className="text-primary-accent">{currentProject.name}</span>
      </h4>

      {isCurrentUserOwner && (
        <form onSubmit={handleAddMember} className="mb-6 p-4 border border-border-color rounded-md space-y-3">
          <h5 className="text-md font-medium text-text-primary">Invite New Member</h5>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="email"
              placeholder="User's email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-grow mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className="mt-1 block w-full sm:w-auto px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text bg-button-primary-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50"
            >
              {isLoading ? 'Inviting...' : 'Invite'}
            </button>
          </div>
           {error && <p className="text-sm text-red-500">{error}</p>} {/* Show add member specific error */}
        </form>
      )}

      {members.length === 0 && !isLoading && <p className="text-text-secondary">No members yet (besides the owner).</p>}
      {members.length > 0 && (
        <ul className="space-y-2">
          {members.map((member: ProjectMember) => (
            <li
              key={member.user_id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-background rounded-md border border-border-color shadow-sm"
            >
              <div className="truncate">
                <span className="font-medium text-text-primary">{member.username || member.email}</span>
                <span className="text-sm text-text-secondary ml-2">({member.role})</span>
              </div>
              {isCurrentUserOwner && member.role !== 'owner' && (
                <div className="mt-2 sm:mt-0 flex space-x-2 items-center">
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateRole(member.user_id, e.target.value as 'editor' | 'viewer')}
                    disabled={isLoading}
                    className="block w-full sm:w-auto px-2 py-1.5 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent text-sm bg-input-background text-input-text-color"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm rounded-md bg-button-danger-bg text-button-danger-text hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectMembers;
