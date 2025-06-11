import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, selectProjectsLoading, selectProjectsError, clearProjectsError } from '../projectSlice';
import { AppDispatch } from '../../../app/store'; // Adjust path

const ProjectCreateForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectProjectsLoading) === 'pending';
  const error = useSelector(selectProjectsError);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Project name is required.');
      return;
    }
    dispatch(clearProjectsError()); // Clear previous errors
    try {
      await dispatch(createProject({ name, description })).unwrap();
      setName('');
      setDescription('');
      // Optionally, provide feedback like a toast message or redirect
      alert('Project created successfully!');
    } catch (err) {
      // Error is handled by the slice and displayed by selectProjectsError
      console.error('Failed to create project:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card-background p-4 rounded-lg shadow border border-border-color mt-2 mb-4">
      <h3 className="text-lg font-medium text-text-primary">Create New Project</h3>
      {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-2 rounded">Error: {error}</p>}
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-text-secondary">
          Project Name
        </label>
        <input
          id="projectName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
          className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
        />
      </div>
      <div>
        <label htmlFor="projectDescription" className="block text-sm font-medium text-text-secondary">
          Description (Optional)
        </label>
        <textarea
          id="projectDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text bg-button-primary-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
};

export default ProjectCreateForm;
