import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AppDispatch, RootState } from '../../../app/store';
import { setTaskFilters, clearTaskFilters, fetchTasksByProject, selectTaskFilters, Task, TaskFilters } from '../taskSlice';
import { selectProjectMembers, ProjectMember } from '../../projects/projectSlice'; // For assignee filter
import { selectCurrentProject } from '../../projects/projectSlice';

const TaskFiltersComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentProject = useSelector(selectCurrentProject);
  const currentFilters = useSelector(selectTaskFilters);
  const projectMembers = useSelector(selectProjectMembers);

  // Local state for form inputs, initialized from Redux state
  const [status, setStatus] = useState<Task['status'] | ''>(currentFilters.status || '');
  const [priority, setPriority] = useState<Task['priority'] | ''>(currentFilters.priority || '');
  const [assigneeId, setAssigneeId] = useState<string>(currentFilters.assignee_id || '');
  const [dueDateAfter, setDueDateAfter] = useState<Date | null>(currentFilters.due_date_after ? new Date(currentFilters.due_date_after) : null);
  const [dueDateBefore, setDueDateBefore] = useState<Date | null>(currentFilters.due_date_before ? new Date(currentFilters.due_date_before) : null);

  // Update local state if Redux filters change (e.g. on clear)
  useEffect(() => {
    setStatus(currentFilters.status || '');
    setPriority(currentFilters.priority || '');
    setAssigneeId(currentFilters.assignee_id || '');
    setDueDateAfter(currentFilters.due_date_after ? new Date(currentFilters.due_date_after) : null);
    setDueDateBefore(currentFilters.due_date_before ? new Date(currentFilters.due_date_before) : null);
  }, [currentFilters]);


  const handleApplyFilters = () => {
    if (!currentProject) return;
    const filtersToApply: Partial<TaskFilters> = {
      status: status || null,
      priority: priority || null,
      assignee_id: assigneeId || null,
      due_date_after: dueDateAfter ? dueDateAfter.toISOString().split('T')[0] : null, // Send as YYYY-MM-DD
      due_date_before: dueDateBefore ? dueDateBefore.toISOString().split('T')[0] : null,
    };
    dispatch(setTaskFilters(filtersToApply));
    dispatch(fetchTasksByProject(currentProject.id));
  };

  const handleClearFilters = () => {
    if (!currentProject) return;
    dispatch(clearTaskFilters());
    // Reset local form state
    setStatus('');
    setPriority('');
    setAssigneeId('');
    setDueDateAfter(null);
    setDueDateBefore(null);
    // Fetch tasks with cleared filters
    dispatch(fetchTasksByProject(currentProject.id));
  };

  if (!currentProject) {
    return null;
  }

  const inputBaseClass = "mt-1 block w-full px-3 py-2 border border-input-border-color rounded-md shadow-sm focus:ring-primary-accent focus:border-primary-accent sm:text-sm bg-input-background text-input-text-color";
  const labelBaseClass = "block text-sm font-medium text-text-secondary";
  const buttonBaseClass = "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-primary-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-50";


  return (
    <div className="p-4 my-4 bg-card-background border border-border-color rounded-lg shadow space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
      <h4 className="text-md font-semibold text-text-primary w-full mb-2 md:mb-0 md:hidden">Filter Tasks</h4>

      <div className="flex-auto">
        <label htmlFor="filter-status" className={labelBaseClass}>Status</label>
        <select id="filter-status" value={status} onChange={(e) => setStatus(e.target.value as Task['status'] | '')} className={inputBaseClass}>
          <option value="">Any</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="flex-auto">
        <label htmlFor="filter-priority" className={labelBaseClass}>Priority</label>
        <select id="filter-priority" value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'] | '')} className={inputBaseClass}>
          <option value="">Any</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex-auto">
        <label htmlFor="filter-assignee" className={labelBaseClass}>Assignee</label>
        <select id="filter-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} disabled={projectMembers.length === 0} className={inputBaseClass}>
          <option value="">Any</option>
          {projectMembers.map((member: ProjectMember) => (
            <option key={member.user_id} value={member.user_id}>
              {member.username || member.email}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-auto">
        <label htmlFor="filter-due-after" className={labelBaseClass}>Due After</label>
        <DatePicker
            id="filter-due-after"
            selected={dueDateAfter}
            onChange={(date) => setDueDateAfter(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="YYYY-MM-DD"
            isClearable
            className={`${inputBaseClass} w-full`} // Datepicker needs w-full too
        />
      </div>

      <div className="flex-auto">
        <label htmlFor="filter-due-before" className={labelBaseClass}>Due Before</label>
        <DatePicker
            id="filter-due-before"
            selected={dueDateBefore}
            onChange={(date) => setDueDateBefore(date)}
            dateFormat="yyyy-MM-dd"
            placeholderText="YYYY-MM-DD"
            isClearable
            className={`${inputBaseClass} w-full`}
        />
      </div>

      <div className="flex space-x-2 pt-4 md:pt-0 self-end">
        <button onClick={handleApplyFilters} className={`${buttonBaseClass} bg-button-primary-bg hover:opacity-90`}>Apply</button>
        <button onClick={handleClearFilters} className={`${buttonBaseClass} bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500`}>Clear</button>
      </div>
    </div>
  );
};

export default TaskFiltersComponent;
