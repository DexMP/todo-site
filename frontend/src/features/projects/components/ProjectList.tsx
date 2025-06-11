import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, selectAllProjects, selectProjectsLoading, selectProjectsError, setCurrentProject, Project, deleteProject } from '../projectSlice';
import { AppDispatch, RootState } from '../../../app/store'; // Adjust path
import { fetchTasksByProject } from '../../tasks/taskSlice'; // To load tasks when a project is selected

interface ProjectListProps {
  onProjectSelect: (projectId: string) => void; // Callback to inform parent of selection
}

const ProjectList: React.FC<ProjectListProps> = ({ onProjectSelect }) => {
  const dispatch = useDispatch<AppDispatch>();
  const projects = useSelector(selectAllProjects);
  const isLoading = useSelector(selectProjectsLoading) === 'pending';
  const error = useSelector(selectProjectsError);
  const currentProject = useSelector((state: RootState) => state.projects.currentProject);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleSelectProject = (project: Project) => {
    dispatch(setCurrentProject(project));
    dispatch(fetchTasksByProject(project.id)); // Fetch tasks for the selected project
    onProjectSelect(project.id);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
        alert('Project deleted successfully.');
      } catch (err) {
        alert(`Failed to delete project: ${err}`);
      }
    }
  };

  if (isLoading && projects.length === 0) {
    return <p className="text-text-secondary">Loading projects...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error fetching projects: {error}</p>;
  }

  if (projects.length === 0 && !isLoading) {
    return <p className="text-text-secondary">No projects yet. Create one!</p>;
  }

  return (
    <div className="space-y-2">
      {isLoading && projects.length > 0 && <p className="text-sm text-text-secondary">Updating project list...</p>}
      <ul className="space-y-1">
        {projects.map((project) => (
          <li key={project.id}>
            <div
              onClick={() => handleSelectProject(project)}
              className={`
                group flex justify-between items-center p-3 rounded-md cursor-pointer transition-all
                text-text-primary hover:bg-primary-accent hover:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-accent
                ${currentProject?.id === project.id ? 'bg-primary-accent text-white shadow-md' : 'bg-card-background hover:bg-opacity-80 dark:hover:bg-opacity-20'}
              `}
              tabIndex={0} // Make it focusable
              onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectProject(project)}
            >
              <span className="font-medium truncate">{project.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent project selection when clicking delete
                  handleDeleteProject(project.id);
                }}
                className="ml-2 p-1 rounded text-sm text-red-500 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Delete project ${project.name}`}
              >
                {/* Simple X icon, replace with SVG if desired */}
                X
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectList;
