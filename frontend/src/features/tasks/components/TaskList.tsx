import React from 'react';
import { useSelector } from 'react-redux';
import { selectTasksByProjectId, selectTasksLoading, selectTasksError, Task } from '../taskSlice';
import { RootState } from '../../../app/store'; // Adjust path
import TaskItem from './TaskItem';
import TaskCreateForm from './TaskCreateForm';

interface TaskListProps {
  projectId: string;
}

const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  // Note: If using selectTasksByProjectId, ensure it handles undefined/empty states gracefully.
  // It's often better to get all tasks for the project and then filter/sort in the component
  // or have more specific selectors.
  const tasks = useSelector((state: RootState) => selectTasksByProjectId(state, projectId));
  const isLoading = useSelector(selectTasksLoading) === 'pending';
  const error = useSelector(selectTasksError);

  // Filter tasks for display if needed, e.g., by status for different lists
  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inprogressTasks = tasks.filter(task => task.status === 'inprogress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  if (isLoading && tasks.length === 0) {
    return <p>Loading tasks...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error loading tasks: {error}</p>;
  }

  if (!projectId) {
    return <p>Please select a project to see tasks.</p>;
  }

  return (
    <div>
      <h3>Tasks for Project {projectId}</h3>
      <TaskCreateForm projectId={projectId} />

      {tasks.length === 0 && !isLoading && <p>No tasks yet for this project. Add one!</p>}

      {tasks.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div>
            <h4>To Do</h4>
            {todoTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
          <div>
            <h4>In Progress</h4>
            {inprogressTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
          <div>
            <h4>Done</h4>
            {doneTasks.map(task => <TaskItem key={task.id} task={task} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
