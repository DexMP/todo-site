import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { setTaskSorting, fetchTasksByProject, selectTaskSorting, TaskSorting } from '../taskSlice';
import { selectCurrentProject } from '../../projects/projectSlice';

const TaskSortOptionsComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector(selectCurrentProject);
  const currentSorting = useSelector(selectTaskSorting);

  const handleSortChange = (sortBy: TaskSorting['sortBy'], sortOrder?: TaskSorting['sortOrder']) => {
    if (!currentProject) return;

    const newSorting: Partial<TaskSorting> = { sortBy };
    if (sortOrder) {
      newSorting.sortOrder = sortOrder;
    } else {
      // Toggle order if only sortBy is changed and it's the same as current, else default to 'asc'
      if (currentSorting.sortBy === sortBy) {
        newSorting.sortOrder = currentSorting.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        newSorting.sortOrder = 'asc'; // Default for new field
      }
    }

    dispatch(setTaskSorting(newSorting));
    dispatch(fetchTasksByProject(currentProject.id));
  };

  if (!currentProject) {
    return null;
  }

  const inputBaseClass = "mt-1 block w-auto px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color";
  const labelBaseClass = "block text-sm font-medium text-text-secondary";
  const buttonBaseClass = "px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50";

  return (
    <div className="p-4 my-4 bg-card-background border border-border-color rounded-lg shadow md:flex md:items-center md:gap-4">
      <h4 className="text-md font-semibold text-text-primary mb-2 md:mb-0 md:hidden">Sort Tasks</h4> {/* Hidden on md+ screens */}
      <div className="flex items-center gap-2">
        <label htmlFor="sortBy" className={labelBaseClass}>Sort by:</label>
        <select
          id="sortBy"
          value={currentSorting.sortBy}
          onChange={(e) => handleSortChange(e.target.value as TaskSorting['sortBy'])}
          className={`${inputBaseClass}`}
        >
          <option value="createdAt">Creation Date</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <button
        onClick={() => handleSortChange(currentSorting.sortBy, currentSorting.sortOrder === 'asc' ? 'desc' : 'asc')}
        className={`${buttonBaseClass} bg-card-background text-text-primary border-border-color hover:bg-background`}
      >
        {currentSorting.sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
      </button>
    </div>
  );
};

export default TaskSortOptionsComponent;
