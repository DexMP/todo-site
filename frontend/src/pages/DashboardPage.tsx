import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ProjectList from '../features/projects/components/ProjectList';
import ProjectCreateForm from '../features/projects/components/ProjectCreateForm';
// import TaskList from '../features/tasks/components/TaskList';
import TaskBoard from '../features/tasks/components/TaskBoard';
import ProjectMembers from '../features/projects/components/ProjectMembers';
import TaskFiltersComponent from '../features/tasks/components/TaskFilters'; // Added
import TaskSortOptionsComponent from '../features/tasks/components/TaskSortOptions'; // Added
import { RootState } from '../app/store';

const DashboardPage: React.FC = () => {
  const currentProject = useSelector((state: RootState) => state.projects.currentProject);
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);

  // selectedProjectId is mainly for ProjectList to know which project is active for styling.
  // The actual currentProject is managed in Redux.
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(currentProject?.id || null);

  const handleProjectSelected = (projectId: string) => {
    setSelectedProjectId(projectId);
    // The actual fetching of tasks for the selected project is handled within ProjectList/setCurrentProject logic
  };

  return (
    <div className="flex flex-col md:flex-row h-full flex-grow">
      {/* Sidebar for Projects */}
      <aside className="w-full md:w-1/4 bg-card-background border-r border-border-color p-4 space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Projects</h2>
          <button
            onClick={() => setShowCreateProjectForm(!showCreateProjectForm)}
            className="px-3 py-1.5 text-sm rounded-md bg-primary-accent text-button-primary-text hover:opacity-90 transition-opacity"
          >
            {showCreateProjectForm ? 'Cancel' : '+ New'}
          </button>
        </div>
        {showCreateProjectForm && <ProjectCreateForm />}
        <ProjectList onProjectSelect={handleProjectSelected} />
      </aside>

      {/* Main Content Area for Tasks and Members */}
      <main className="w-full md:w-3/4 p-4 md:p-6 overflow-y-auto">
        {currentProject ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-1">
                Tasks for: <span className="text-primary-accent">{currentProject.name}</span>
              </h2>
              <p className="text-sm text-text-secondary">{currentProject.description}</p>
            </div>
            <TaskFiltersComponent />
            <TaskSortOptionsComponent />
            <TaskBoard projectId={currentProject.id} />
            <ProjectMembers />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg text-text-secondary">
              Select a project to view its tasks and members, or create a new project to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
