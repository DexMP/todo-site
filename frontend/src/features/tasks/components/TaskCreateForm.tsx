import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, selectTasksLoading, selectTasksError, clearTasksError, Task } from '../taskSlice';
import { AppDispatch, RootState } from '../../../app/store'; // Adjust path
import { selectProjectMembers, fetchProjectMembers, ProjectMember } from '../../projects/projectSlice'; // Import members related state and actions

interface TaskCreateFormProps {
  projectId: string; // To associate the task with a project
}

const TaskCreateForm: React.FC<TaskCreateFormProps> = ({ projectId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectTasksLoading) === 'pending';
  const error = useSelector(selectTasksError);
  const projectMembers = useSelector(selectProjectMembers); // Get project members

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Fetch members when projectId changes, if not already loaded for the current project
    // This check might be more sophisticated depending on how members are loaded globally
    if (projectId) {
       // dispatch(fetchProjectMembers(projectId)); // Already dispatched by ProjectList on project select.
                                                 // Consider if direct dispatch here is needed if this form can exist without ProjectList.
    }
  }, [dispatch, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('Task title is required.'); return; }
    if (!projectId) { alert('Project ID is missing. Cannot create task.'); return; }

    dispatch(clearTasksError());
    try {
      await dispatch(createTask({
        title,
        description,
        status,
        priority,
        project_id: projectId,
        assignee_id: assigneeId,
      })).unwrap();
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssigneeId(undefined);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 my-4 bg-card-background border border-border-color rounded-lg shadow space-y-4">
      <h4 className="text-md font-semibold text-text-primary">Add New Task</h4>
      {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">Error: {error}</p>}

      <div>
        <label htmlFor="taskTitle" className="block text-sm font-medium text-text-secondary">Title</label>
        <input
          id="taskTitle"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          required
          className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
        />
      </div>

      <div>
        <label htmlFor="taskDescription" className="block text-sm font-medium text-text-secondary">Description (Optional)</label>
        <textarea
          id="taskDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="taskStatus" className="block text-sm font-medium text-text-secondary">Status</label>
          <select
            id="taskStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value as Task['status'])}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
          >
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="taskPriority" className="block text-sm font-medium text-text-secondary">Priority</label>
          <select
            id="taskPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="taskAssignee" className="block text-sm font-medium text-text-secondary">Assignee (Optional)</label>
          <select
            id="taskAssignee"
            value={assigneeId || ''}
            onChange={(e) => setAssigneeId(e.target.value || undefined)}
            disabled={isLoading || projectMembers.length === 0}
            className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
          >
            <option value="">Unassigned</option>
            {projectMembers.map((member: ProjectMember) => (
              <option key={member.user_id} value={member.user_id}>
                {member.username || member.email}
              </option>
            ))}
          </select>
          {projectMembers.length === 0 && <small className="text-xs text-text-secondary">No members to assign.</small>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text bg-button-primary-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50"
      >
        {isLoading ? 'Adding Task...' : 'Add Task'}
      </button>
    </form>
  );
};

export default TaskCreateForm;
