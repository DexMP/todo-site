import React from 'react';
import { Task, deleteTask, updateTask } from '../taskSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../app/store';
import { selectProjectMembers, ProjectMember } from '../../projects/projectSlice'; // To select assignee

interface TaskItemProps {
  task: Task;
  isDraggable?: boolean;
  draggableProps?: any;
  dragHandleProps?: any;
  innerRef?: (element: HTMLElement | null) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, isDraggable, draggableProps, dragHandleProps, innerRef }) => {
  const dispatch = useDispatch<AppDispatch>();
  const projectMembers = useSelector(selectProjectMembers); // Get project members for assignee dropdown

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete task: "${task.title}"?`)) {
      dispatch(deleteTask({ projectId: task.project_id, taskId: task.id }))
        .unwrap().catch(err => alert(`Failed to delete task: ${err.message}`));
    }
  };

  const handlePropertyChange = (property: keyof Task, value: any) => {
    if (task[property] === value) return;
    dispatch(updateTask({ ...task, [property]: value }))
      .unwrap().catch(err => alert(`Failed to update task ${property}: ${err.message}`));
  };

  const assignedUser = projectMembers.find(m => m.user_id === task.assignee_id);

  const priorityClasses: Record<Task['priority'], string> = {
    low: 'border-l-4 border-blue-500',
    medium: 'border-l-4 border-yellow-500',
    high: 'border-l-4 border-red-500',
  };
  const statusClasses: Record<Task['status'], string> = {
    todo: 'bg-gray-200 dark:bg-gray-600',
    inprogress: 'bg-blue-200 dark:bg-blue-700',
    done: 'bg-green-200 dark:bg-green-800 line-through',
  }

  const content = (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={`p-4 mb-3 bg-card-background rounded-lg shadow border border-border-color ${priorityClasses[task.priority]} ${task.status === 'done' ? 'opacity-70' : ''} group`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-lg font-semibold text-text-primary truncate ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</h4>
        <button
            onClick={handleDelete}
            className="p-1 rounded text-sm text-red-500 hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete task ${task.title}`}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      <p className={`text-sm text-text-secondary mb-3 min-h-[20px] ${task.status === 'done' ? 'line-through' : ''}`}>
        {task.description || <span className="italic">No description</span>}
      </p>

      <div className="text-xs text-text-secondary mb-3 space-y-1">
        {task.due_date && (
          <div className="flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
        <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Assignee: {assignedUser ? (assignedUser.username || assignedUser.email) : <span className="italic">Unassigned</span>}
        </div>
         <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusClasses[task.status]} text-text-primary`}>
            {task.priority} priority
        </div>
      </div>

      <div className="mt-2 flex items-center space-x-2">
        <label htmlFor={`status-${task.id}`} className="sr-only">Status</label>
        <select
          id={`status-${task.id}`}
          value={task.status}
          onChange={(e) => handlePropertyChange('status', e.target.value as Task['status'])}
          className="text-xs p-1 border border-input-border-color rounded shadow-sm bg-input-background text-input-text-color focus:ring-primary-accent focus:border-primary-accent"
        >
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <label htmlFor={`assignee-${task.id}`} className="sr-only">Assignee</label>
        <select
          id={`assignee-${task.id}`}
          value={task.assignee_id || ''}
          onChange={(e) => handlePropertyChange('assignee_id', e.target.value || undefined)}
          className="text-xs p-1 border border-input-border-color rounded shadow-sm bg-input-background text-input-text-color focus:ring-primary-accent focus:border-primary-accent"
          disabled={projectMembers.length === 0}
        >
          <option value="">Unassigned</option>
          {projectMembers.map((member: ProjectMember) => (
            <option key={member.user_id} value={member.user_id}>
              {member.username || member.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  // If isDraggable is true, the direct child must be what the Draggable HOC expects.
  // The ref and props must be applied to the HTML element you want to move.
  return content; // The div with itemStyle is already the draggable element.
};

export default TaskItem;
